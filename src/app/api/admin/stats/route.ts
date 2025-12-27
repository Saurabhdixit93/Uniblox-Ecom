import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import Order from "@/lib/db/models/Order.model";
import DiscountCode from "@/lib/db/models/DiscountCode.model";
import { getStoreSettings } from "@/lib/db/models/StoreSettings.model";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const [orders, discountStats, settings] = await Promise.all([
      Order.find({ paymentStatus: "completed" })
        .sort({ createdAt: -1 })
        .limit(10)
        .lean(),
      DiscountCode.aggregate([
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            used: { $sum: { $cond: ["$isUsed", 1, 0] } },
          },
        },
      ]),
      getStoreSettings(),
    ]);

    const totalRevenue = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      {
        $group: {
          _id: null,
          total: { $sum: "$total" },
          discount: { $sum: "$discountAmount" },
        },
      },
    ]);

    const totalItemsPurchased = await Order.aggregate([
      { $match: { paymentStatus: "completed" } },
      { $unwind: "$items" },
      { $group: { _id: null, total: { $sum: "$items.quantity" } } },
    ]);

    const stats = discountStats[0] || { total: 0, used: 0 };
    const revenue = totalRevenue[0] || { total: 0, discount: 0 };
    const items = totalItemsPurchased[0] || { total: 0 };

    return NextResponse.json({
      success: true,
      stats: {
        totalOrders: settings.totalOrders,
        totalRevenue: revenue.total,
        totalDiscountGiven: revenue.discount,
        totalItemsPurchased: items.total,
        discountCodes: {
          total: stats.total,
          used: stats.used,
          available: stats.total - stats.used,
        },
        settings: {
          nthOrderDiscount: settings.nthOrderDiscount,
          discountPercent: settings.discountPercent,
          defaultDiscountExpiry: settings.defaultDiscountExpiry,
        },
      },
      recentOrders: orders.map((o) => ({
        id: o._id,
        orderNumber: o.orderNumber,
        total: o.total,
        discountAmount: o.discountAmount,
        status: o.status,
        createdAt: o.createdAt,
        customerName: o.shippingAddress?.name || "N/A",
      })),
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

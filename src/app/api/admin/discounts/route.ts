import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import DiscountCode from "@/lib/db/models/DiscountCode.model";
import { getStoreSettings } from "@/lib/db/models/StoreSettings.model";
import { generateDiscountCode, getExpiryDate } from "@/lib/utils";

const generateDiscountSchema = z.object({
  discountPercent: z.number().min(1).max(100).optional(),
  expiryDays: z.number().int().min(1).nullable().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const filter = searchParams.get("filter") || "all";

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = {};
    if (filter === "used") query.isUsed = true;
    else if (filter === "unused") query.isUsed = false;

    const skip = (page - 1) * limit;

    const [discounts, total] = await Promise.all([
      DiscountCode.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("usedBy", "name email")
        .lean(),
      DiscountCode.countDocuments(query),
    ]);

    return NextResponse.json({
      success: true,
      discounts: discounts.map((d) => ({
        id: d._id,
        code: d.code,
        discountPercent: d.discountPercent,
        isUsed: d.isUsed,
        usedBy: d.usedBy,
        usedAt: d.usedAt,
        generatedForOrder: d.generatedForOrder,
        expiresAt: d.expiresAt,
        isExpired: d.expiresAt ? new Date() > new Date(d.expiresAt) : false,
        createdAt: d.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error("Get discounts error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch discounts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json().catch(() => ({}));
    const validationResult = generateDiscountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();

    const settings = await getStoreSettings();
    const { discountPercent, expiryDays } = validationResult.data;

    const code = generateDiscountCode();
    const expiresAt = expiryDays
      ? getExpiryDate(expiryDays)
      : settings.defaultDiscountExpiry
      ? getExpiryDate(settings.defaultDiscountExpiry)
      : undefined;

    const discount = await DiscountCode.create({
      code,
      discountPercent: discountPercent || settings.discountPercent,
      isUsed: false,
      generatedForOrder: 0,
      expiresAt,
    });

    return NextResponse.json({
      success: true,
      message: "Discount code generated",
      discount: {
        code: discount.code,
        discountPercent: discount.discountPercent,
        expiresAt: discount.expiresAt,
      },
    });
  } catch (error) {
    console.error("Generate discount error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate discount" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { discountId, expiryDays } = body;

    if (!discountId) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const discount = await DiscountCode.findById(discountId);
    if (!discount) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    if (expiryDays !== undefined) {
      discount.expiresAt = expiryDays ? getExpiryDate(expiryDays) : undefined;
    }

    await discount.save();

    return NextResponse.json({
      success: true,
      message: "Discount updated",
      discount: { code: discount.code, expiresAt: discount.expiresAt },
    });
  } catch (error) {
    console.error("Update discount error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update discount" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== "admin") {
      return NextResponse.json(
        { success: false, error: "Admin access required" },
        { status: 403 }
      );
    }

    const { searchParams } = new URL(request.url);
    const discountId = searchParams.get("id");

    if (!discountId) {
      return NextResponse.json(
        { success: false, error: "Discount ID is required" },
        { status: 400 }
      );
    }

    await connectDB();

    const discount = await DiscountCode.findByIdAndDelete(discountId);
    if (!discount) {
      return NextResponse.json(
        { success: false, error: "Discount not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, message: "Discount deleted" });
  } catch (error) {
    console.error("Delete discount error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to delete" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import { getStoreSettings } from "@/lib/db/models/StoreSettings.model";

const updateSettingsSchema = z.object({
  nthOrderDiscount: z.number().int().min(1).optional(),
  discountPercent: z.number().min(1).max(100).optional(),
  defaultDiscountExpiry: z.number().int().min(1).nullable().optional(),
});

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
    const settings = await getStoreSettings();

    return NextResponse.json({
      success: true,
      settings: {
        nthOrderDiscount: settings.nthOrderDiscount,
        discountPercent: settings.discountPercent,
        defaultDiscountExpiry: settings.defaultDiscountExpiry,
        totalOrders: settings.totalOrders,
      },
    });
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch settings" },
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
    const validationResult = updateSettingsSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    await connectDB();
    const settings = await getStoreSettings();
    const { nthOrderDiscount, discountPercent, defaultDiscountExpiry } =
      validationResult.data;

    if (nthOrderDiscount !== undefined)
      settings.nthOrderDiscount = nthOrderDiscount;
    if (discountPercent !== undefined)
      settings.discountPercent = discountPercent;
    if (defaultDiscountExpiry !== undefined)
      settings.defaultDiscountExpiry = defaultDiscountExpiry ?? undefined;

    await settings.save();

    return NextResponse.json({
      success: true,
      message: "Settings updated successfully",
      settings: {
        nthOrderDiscount: settings.nthOrderDiscount,
        discountPercent: settings.discountPercent,
        defaultDiscountExpiry: settings.defaultDiscountExpiry,
      },
    });
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

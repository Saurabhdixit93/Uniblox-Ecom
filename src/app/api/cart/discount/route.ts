/**
 * Apply Discount Code API
 *
 * Handles applying and removing discount codes from cart
 *
 * @module app/api/cart/discount/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import Cart from "@/lib/db/models/Cart.model";
import DiscountCode from "@/lib/db/models/DiscountCode.model";

/**
 * Apply discount schema
 */
const applyDiscountSchema = z.object({
  code: z.string().min(1, "Discount code is required").toUpperCase(),
});

/**
 * POST /api/cart/discount
 *
 * Applies a discount code to the cart
 * Validates that code exists, is unused, and not expired
 *
 * @param {NextRequest} request - The incoming request with discount code
 * @returns {Promise<NextResponse>} JSON response with discount details
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = applyDiscountSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { code } = validationResult.data;

    await connectDB();

    // Find discount code
    const discountCode = await DiscountCode.findOne({
      code: code.toUpperCase(),
    });

    if (!discountCode) {
      return NextResponse.json(
        { success: false, error: "Invalid discount code" },
        { status: 404 }
      );
    }

    // Check if already used
    if (discountCode.isUsed) {
      return NextResponse.json(
        { success: false, error: "This discount code has already been used" },
        { status: 400 }
      );
    }

    // Check if expired
    if (discountCode.expiresAt && new Date() > discountCode.expiresAt) {
      return NextResponse.json(
        { success: false, error: "This discount code has expired" },
        { status: 400 }
      );
    }

    // Find cart
    const cart = await Cart.findOne({ user: session.user.id });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 }
      );
    }

    if (cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cannot apply discount to empty cart" },
        { status: 400 }
      );
    }

    // Apply discount to cart
    cart.appliedDiscount = discountCode._id;
    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Discount code applied",
      discount: {
        code: discountCode.code,
        percent: discountCode.discountPercent,
      },
    });
  } catch (error) {
    console.error("Apply discount error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to apply discount" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/discount
 *
 * Removes applied discount code from cart
 *
 * @returns {Promise<NextResponse>} JSON response confirming removal
 */
export async function DELETE() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    await Cart.findOneAndUpdate(
      { user: session.user.id },
      { appliedDiscount: null }
    );

    return NextResponse.json({
      success: true,
      message: "Discount removed",
    });
  } catch (error) {
    console.error("Remove discount error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove discount" },
      { status: 500 }
    );
  }
}

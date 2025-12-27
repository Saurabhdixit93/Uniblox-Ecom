/**
 * Cart Item Update API
 *
 * Handles updating quantity of a specific cart item
 *
 * @module app/api/cart/[productId]/route
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import Cart from "@/lib/db/models/Cart.model";
import Product from "@/lib/db/models/Product.model";

/**
 * Update quantity schema
 */
const updateSchema = z.object({
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

/**
 * PATCH /api/cart/[productId]
 *
 * Updates the quantity of a cart item
 *
 * @param {NextRequest} request - The incoming request with new quantity
 * @param {Object} params - Route parameters containing productId
 * @returns {Promise<NextResponse>} JSON response with success status
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validationResult = updateSchema.safeParse(body);

    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { quantity } = validationResult.data;
    const { productId } = await params;

    await connectDB();

    // Check stock
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }

    if (quantity > product.stock) {
      return NextResponse.json(
        { success: false, error: "Quantity exceeds available stock" },
        { status: 400 }
      );
    }

    // Update cart item
    const cart = await Cart.findOne({ user: session.user.id });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 }
      );
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return NextResponse.json(
        { success: false, error: "Item not in cart" },
        { status: 404 }
      );
    }

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Cart updated",
    });
  } catch (error) {
    console.error("Update cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to update cart" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart/[productId]
 *
 * Removes a specific item from the cart
 *
 * @param {NextRequest} request - The incoming request
 * @param {Object} params - Route parameters containing productId
 * @returns {Promise<NextResponse>} JSON response with success status
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    const { productId } = await params;

    await connectDB();

    const cart = await Cart.findOne({ user: session.user.id });

    if (!cart) {
      return NextResponse.json(
        { success: false, error: "Cart not found" },
        { status: 404 }
      );
    }

    // Remove item from cart
    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId
    );

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Item removed from cart",
    });
  } catch (error) {
    console.error("Remove from cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to remove item" },
      { status: 500 }
    );
  }
}

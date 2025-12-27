/**
 * @fileoverview Cart API Routes - Shopping cart CRUD operations
 *
 * This module provides REST API endpoints for managing user shopping carts.
 * All routes require authentication via session.
 *
 * @module api/cart
 * @requires next/server
 * @requires zod
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import Cart from "@/lib/db/models/Cart.model";
import Product from "@/lib/db/models/Product.model";
// Import DiscountCode to register the schema for Cart.appliedDiscount population
import "@/lib/db/models/DiscountCode.model";

/**
 * Zod schema for add-to-cart request validation.
 */
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

/**
 * GET /api/cart
 *
 * Retrieves the current user's cart with populated product details.
 * Creates an empty cart if none exists.
 *
 * @async
 * @function GET
 * @returns {Promise<NextResponse>} JSON response with cart data
 *
 * @example Response (success):
 * {
 *   "success": true,
 *   "cart": {
 *     "items": [
 *       {
 *         "productId": "...",
 *         "name": "Product Name",
 *         "price": 999,
 *         "image": "/image.jpg",
 *         "quantity": 2,
 *         "stock": 10,
 *         "total": 1998
 *       }
 *     ],
 *     "itemCount": 2,
 *     "subtotal": 1998,
 *     "discount": { "code": "UNIBLOX-XXXX", "percent": 10 },
 *     "discountAmount": 199.8,
 *     "total": 1798.2
 *   }
 * }
 *
 * @example Response (error - unauthenticated):
 * { "success": false, "error": "Authentication required" }
 */
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required" },
        { status: 401 }
      );
    }

    await connectDB();

    let cart = await Cart.findOne({ user: session.user.id })
      .populate({
        path: "items.product",
        select: "name price image stock isActive",
      })
      .populate({
        path: "appliedDiscount",
        select: "code discountPercent isUsed expiresAt",
      })
      .lean();

    if (!cart) {
      cart = await Cart.create({ user: session.user.id, items: [] });
      return NextResponse.json({
        success: true,
        cart: {
          items: [],
          itemCount: 0,
          subtotal: 0,
          discount: null,
          discountAmount: 0,
          total: 0,
        },
      });
    }

    // Filter out inactive or deleted products
    const validItems = cart.items.filter(
      (item) =>
        item.product &&
        (item.product as unknown as { isActive: boolean }).isActive
    );

    // Calculate subtotal
    const subtotal = validItems.reduce((sum, item) => {
      const product = item.product as unknown as { price: number };
      return sum + product.price * item.quantity;
    }, 0);

    // Process applied discount if valid
    let discountAmount = 0;
    let discountInfo = null;

    if (cart.appliedDiscount) {
      const discount = cart.appliedDiscount as unknown as {
        code: string;
        discountPercent: number;
        isUsed: boolean;
        expiresAt?: Date;
      };
      const isExpired =
        discount.expiresAt && new Date() > new Date(discount.expiresAt);
      if (!discount.isUsed && !isExpired) {
        discountAmount =
          Math.round(((subtotal * discount.discountPercent) / 100) * 100) / 100;
        discountInfo = {
          code: discount.code,
          percent: discount.discountPercent,
        };
      }
    }

    const total = subtotal - discountAmount;
    const itemCount = validItems.reduce((sum, item) => sum + item.quantity, 0);

    return NextResponse.json({
      success: true,
      cart: {
        items: validItems.map((item) => {
          const product = item.product as unknown as {
            _id: string;
            name: string;
            price: number;
            image: string;
            stock: number;
          };
          return {
            productId: product._id,
            name: product.name,
            price: product.price,
            image: product.image,
            quantity: item.quantity,
            stock: product.stock,
            total: product.price * item.quantity,
          };
        }),
        itemCount,
        subtotal,
        discount: discountInfo,
        discountAmount,
        total,
      },
    });
  } catch (error) {
    console.error("Cart fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch cart" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/cart
 *
 * Adds an item to the user's cart or updates quantity if item exists.
 * Validates product availability and stock levels.
 *
 * @async
 * @function POST
 * @param {NextRequest} request - Request with productId and quantity in body
 * @returns {Promise<NextResponse>} JSON response with success status
 *
 * @example Request body:
 * { "productId": "...", "quantity": 2 }
 *
 * @example Response (success):
 * { "success": true, "message": "Item added to cart", "itemCount": 3 }
 *
 * @example Response (error - insufficient stock):
 * { "success": false, "error": "Insufficient stock" }
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
    const validationResult = addToCartSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { productId, quantity } = validationResult.data;
    await connectDB();

    // Validate product exists and is available
    const product = await Product.findById(productId);
    if (!product) {
      return NextResponse.json(
        { success: false, error: "Product not found" },
        { status: 404 }
      );
    }
    if (!product.isActive) {
      return NextResponse.json(
        { success: false, error: "Product is not available" },
        { status: 400 }
      );
    }
    if (product.stock < quantity) {
      return NextResponse.json(
        { success: false, error: "Insufficient stock" },
        { status: 400 }
      );
    }

    // Get or create cart
    let cart = await Cart.findOne({ user: session.user.id });
    if (!cart) {
      cart = new Cart({ user: session.user.id, items: [] });
    }

    // Update existing item or add new
    const existingItemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );
    if (existingItemIndex > -1) {
      const newQuantity = cart.items[existingItemIndex].quantity + quantity;
      if (newQuantity > product.stock) {
        return NextResponse.json(
          { success: false, error: "Quantity exceeds available stock" },
          { status: 400 }
        );
      }
      cart.items[existingItemIndex].quantity = newQuantity;
    } else {
      cart.items.push({
        product: product._id,
        quantity,
        priceAtAdd: product.price,
      });
    }

    await cart.save();

    return NextResponse.json({
      success: true,
      message: "Item added to cart",
      itemCount: cart.items.reduce((sum, item) => sum + item.quantity, 0),
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to add item to cart" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/cart
 *
 * Clears all items from the user's cart and removes any applied discount.
 *
 * @async
 * @function DELETE
 * @returns {Promise<NextResponse>} JSON response with success status
 *
 * @example Response (success):
 * { "success": true, "message": "Cart cleared" }
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
      { items: [], appliedDiscount: null }
    );

    return NextResponse.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    console.error("Clear cart error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to clear cart" },
      { status: 500 }
    );
  }
}

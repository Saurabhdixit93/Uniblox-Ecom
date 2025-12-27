/**
 * @fileoverview Checkout API Routes - Order creation and payment processing
 *
 * This module provides REST API endpoints for checkout flow including
 * Razorpay order creation and payment confirmation. Implements the
 * nth-order discount code generation system.
 *
 * @module api/checkout
 * @requires next/server
 * @requires zod
 * @requires razorpay
 */

import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Razorpay from "razorpay";
import { auth } from "@/lib/auth/auth";
import { connectDB } from "@/lib/db/connection";
import Cart from "@/lib/db/models/Cart.model";
import Order from "@/lib/db/models/Order.model";
import Product from "@/lib/db/models/Product.model";
import DiscountCode from "@/lib/db/models/DiscountCode.model";
import User from "@/lib/db/models/User.model";
import { getStoreSettings } from "@/lib/db/models/StoreSettings.model";
import { generateDiscountCode, getExpiryDate } from "@/lib/utils";

/**
 * Creates and returns a configured Razorpay client instance.
 *
 * @function getRazorpayClient
 * @returns {Razorpay} Configured Razorpay client
 * @throws {Error} If Razorpay credentials are not configured
 */
function getRazorpayClient(): InstanceType<typeof Razorpay> {
  if (
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID ||
    !process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET
  ) {
    throw new Error("Razorpay credentials not configured");
  }
  return new Razorpay({
    key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    key_secret: process.env.NEXT_PUBLIC_RAZORPAY_KEY_SECRET,
  });
}

/**
 * Zod schema for checkout request validation.
 * Supports both authenticated and guest checkout.
 */
const checkoutSchema = z.object({
  shippingAddress: z.object({
    name: z.string().min(2),
    address: z.string().min(5),
    city: z.string().min(2),
    state: z.string().min(2),
    pincode: z.string().min(6),
    phone: z.string().min(10),
  }),
  guestEmail: z.string().email().optional(),
  guestName: z.string().min(2).optional(),
});

/**
 * POST /api/checkout
 *
 * Creates a Razorpay order for the current cart. Supports both authenticated
 * users and guest checkout with email. Validates cart items, stock levels,
 * and applies any valid discounts.
 *
 * @async
 * @function POST
 * @param {NextRequest} request - Request with shipping address in body
 * @returns {Promise<NextResponse>} JSON response with Razorpay order details
 *
 * @example Request body:
 * {
 *   "shippingAddress": {
 *     "name": "John Doe",
 *     "address": "123 Main St",
 *     "city": "Mumbai",
 *     "state": "Maharashtra",
 *     "pincode": "400001",
 *     "phone": "9876543210"
 *   },
 *   "guestEmail": "guest@example.com" // Optional for guest checkout
 * }
 *
 * @example Response (success):
 * {
 *   "success": true,
 *   "order": {
 *     "razorpayOrderId": "order_...",
 *     "amount": 1798.2,
 *     "currency": "INR",
 *     "items": [...],
 *     "subtotal": 1998,
 *     "discountCode": "UNIBLOX-XXXX",
 *     "discountPercent": 10,
 *     "discountAmount": 199.8,
 *     "total": 1798.2
 *   },
 *   "razorpayKey": "rzp_..."
 * }
 */
export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const body = await request.json();

    const validationResult = checkoutSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        { success: false, error: validationResult.error.issues[0].message },
        { status: 400 }
      );
    }

    const { shippingAddress, guestEmail, guestName } = validationResult.data;
    await connectDB();

    let userId = session?.user?.id;

    // Handle guest checkout - create or find user by email
    if (!userId && guestEmail) {
      let user = await User.findOne({ email: guestEmail.toLowerCase() });
      if (!user) {
        const tempPassword = Math.random().toString(36).slice(-12);
        user = await User.create({
          email: guestEmail.toLowerCase(),
          name: guestName || shippingAddress.name,
          password: tempPassword,
          role: "customer",
        });
      }
      userId = user._id.toString();
    }

    if (!userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Authentication required or provide guest email",
        },
        { status: 401 }
      );
    }

    // Fetch and validate cart
    const cart = await Cart.findOne({ user: userId })
      .populate({
        path: "items.product",
        select: "name price image stock isActive",
      })
      .populate({
        path: "appliedDiscount",
        select: "code discountPercent isUsed expiresAt",
      });

    if (!cart || cart.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart is empty" },
        { status: 400 }
      );
    }

    // Validate all items are available and in stock
    const validItems = [];
    for (const item of cart.items) {
      const product = item.product as unknown as {
        _id: string;
        name: string;
        price: number;
        image: string;
        stock: number;
        isActive: boolean;
      };

      if (!product || !product.isActive) {
        return NextResponse.json(
          {
            success: false,
            error: `Product ${
              product?.name || "Unknown"
            } is no longer available`,
          },
          { status: 400 }
        );
      }

      if (item.quantity > product.stock) {
        return NextResponse.json(
          { success: false, error: `Insufficient stock for ${product.name}` },
          { status: 400 }
        );
      }

      validItems.push({
        product: product._id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity: item.quantity,
      });
    }

    // Calculate totals
    const subtotal = validItems.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0
    );

    // Process discount if valid
    let discountPercent = 0;
    let discountAmount = 0;
    let discountCode = null;

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
        discountPercent = discount.discountPercent;
        discountAmount =
          Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
        discountCode = discount.code;
      }
    }

    const total = subtotal - discountAmount;
    const amountInPaise = Math.round(total * 100);

    // Create Razorpay order
    const razorpayOrder = await getRazorpayClient().orders.create({
      amount: amountInPaise,
      currency: "INR",
      receipt: `order_${Date.now()}`,
      notes: { userId, discountCode: discountCode || "" },
    });

    return NextResponse.json({
      success: true,
      order: {
        razorpayOrderId: razorpayOrder.id,
        amount: total,
        amountInPaise,
        currency: "INR",
        items: validItems,
        subtotal,
        discountCode,
        discountPercent,
        discountAmount,
        total,
        shippingAddress,
        userId,
      },
      razorpayKey: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Checkout error:", error);
    return NextResponse.json(
      { success: false, error: "Checkout failed" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/checkout
 *
 * Confirms an order after successful Razorpay payment. Creates the order record,
 * marks discount as used, decrements product stock, clears cart, and generates
 * nth-order discount code if applicable.
 *
 * @async
 * @function PUT
 * @param {NextRequest} request - Request with payment confirmation details
 * @returns {Promise<NextResponse>} JSON response with order confirmation
 *
 * @example Request body:
 * {
 *   "razorpayOrderId": "order_...",
 *   "razorpayPaymentId": "pay_...",
 *   "items": [...],
 *   "subtotal": 1998,
 *   "discountCode": "UNIBLOX-XXXX",
 *   "discountPercent": 10,
 *   "discountAmount": 199.8,
 *   "total": 1798.2,
 *   "shippingAddress": {...},
 *   "userId": "..."
 * }
 *
 * @example Response (success with nth-order discount):
 * {
 *   "success": true,
 *   "message": "Order placed successfully",
 *   "order": {
 *     "orderId": "...",
 *     "orderNumber": 10,
 *     "total": 1798.2,
 *     "status": "processing",
 *     "paymentId": "pay_..."
 *   },
 *   "newDiscountCode": {
 *     "code": "UNIBLOX-NEW1-CODE",
 *     "discountPercent": 10,
 *     "expiresAt": "2024-02-01T00:00:00.000Z"
 *   }
 * }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      razorpayOrderId,
      razorpayPaymentId,
      items,
      subtotal,
      discountCode,
      discountPercent,
      discountAmount,
      total,
      shippingAddress,
      userId,
    } = body;

    if (!razorpayPaymentId || !razorpayOrderId) {
      return NextResponse.json(
        { success: false, error: "Payment details missing" },
        { status: 400 }
      );
    }

    await connectDB();

    // Increment total orders and get new order number
    const settings = await getStoreSettings();
    settings.totalOrders += 1;
    const orderNumber = settings.totalOrders;
    await settings.save();

    // Create order record
    const order = await Order.create({
      user: userId,
      orderNumber,
      items,
      subtotal,
      discountCode: discountCode || null,
      discountPercent: discountPercent || 0,
      discountAmount: discountAmount || 0,
      total,
      paymentId: razorpayPaymentId,
      paymentStatus: "completed",
      status: "processing",
      shippingAddress,
    });

    // Mark discount code as used
    if (discountCode) {
      await DiscountCode.findOneAndUpdate(
        { code: discountCode },
        { isUsed: true, usedBy: userId, usedAt: new Date() }
      );
    }

    // Decrement product stock
    for (const item of items) {
      await Product.findByIdAndUpdate(item.product, {
        $inc: { stock: -item.quantity },
      });
    }

    // Clear user's cart
    await Cart.findOneAndUpdate(
      { user: userId },
      { items: [], appliedDiscount: null }
    );

    // Generate nth-order discount code if applicable
    let newDiscountCode = null;
    if (orderNumber % settings.nthOrderDiscount === 0) {
      const code = generateDiscountCode();
      const expiresAt = settings.defaultDiscountExpiry
        ? getExpiryDate(settings.defaultDiscountExpiry)
        : undefined;

      const discount = await DiscountCode.create({
        code,
        discountPercent: settings.discountPercent,
        isUsed: false,
        generatedForOrder: orderNumber,
        expiresAt,
      });

      newDiscountCode = {
        code: discount.code,
        discountPercent: discount.discountPercent,
        expiresAt: discount.expiresAt,
      };
    }

    return NextResponse.json({
      success: true,
      message: "Order placed successfully",
      order: {
        orderId: order._id,
        orderNumber: order.orderNumber,
        total: order.total,
        status: order.status,
        paymentId: order.paymentId,
      },
      newDiscountCode,
    });
  } catch (error) {
    console.error("Order confirmation error:", error);
    return NextResponse.json(
      { success: false, error: "Order confirmation failed" },
      { status: 500 }
    );
  }
}

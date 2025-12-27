/**
 * @fileoverview Order Model - Customer order management
 *
 * This module defines the Mongoose schema for customer orders including
 * order items, pricing, discounts, payment status, and shipping information.
 * Orders are created after successful Razorpay payment confirmation.
 *
 * @module lib/db/models/Order
 * @requires mongoose
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Order item interface representing a purchased product.
 *
 * @interface IOrderItem
 * @property {mongoose.Types.ObjectId} product - Reference to the Product document
 * @property {string} name - Product name (denormalized for historical record)
 * @property {number} quantity - Number of units purchased
 * @property {number} price - Price per unit at time of purchase
 * @property {string} image - Product image URL
 */
export interface IOrderItem {
  product: mongoose.Types.ObjectId;
  name: string;
  quantity: number;
  price: number;
  image: string;
}

/**
 * Shipping address interface for order delivery.
 *
 * @interface IShippingAddress
 * @property {string} name - Recipient name
 * @property {string} address - Street address
 * @property {string} city - City
 * @property {string} state - State/Province
 * @property {string} pincode - Postal/ZIP code
 * @property {string} phone - Contact phone number
 */
interface IShippingAddress {
  name: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  phone: string;
}

/**
 * Order document interface extending Mongoose Document.
 *
 * @interface IOrder
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique order identifier
 * @property {mongoose.Types.ObjectId} user - Reference to the User document
 * @property {number} orderNumber - Sequential order number (unique)
 * @property {IOrderItem[]} items - Array of purchased items
 * @property {number} subtotal - Total before discount
 * @property {string} [discountCode] - Applied discount code if any
 * @property {number} discountPercent - Discount percentage applied (0-100)
 * @property {number} discountAmount - Calculated discount amount
 * @property {number} total - Final total after discount
 * @property {string} [paymentId] - Razorpay payment ID
 * @property {"pending"|"completed"|"failed"} paymentStatus - Payment status
 * @property {"pending"|"processing"|"shipped"|"delivered"|"cancelled"} status - Order status
 * @property {IShippingAddress} [shippingAddress] - Delivery address
 * @property {Date} createdAt - Timestamp of order creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export interface IOrder extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  orderNumber: number;
  items: IOrderItem[];
  subtotal: number;
  discountCode?: string;
  discountPercent: number;
  discountAmount: number;
  total: number;
  paymentId?: string;
  paymentStatus: "pending" | "completed" | "failed";
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  shippingAddress?: IShippingAddress;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Schema for individual order items.
 * Contains denormalized product data to preserve order history.
 */
const OrderItemSchema = new Schema<IOrderItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    name: { type: String, required: true },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 },
    image: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Schema for shipping address embedded document.
 */
const ShippingAddressSchema = new Schema(
  {
    name: { type: String, required: true },
    address: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true },
    phone: { type: String, required: true },
  },
  { _id: false }
);

/**
 * Main Order schema with validation, enums, and indexing.
 *
 * @description
 * - Order must have at least one item (validated)
 * - Sequential orderNumber is unique
 * - Indexes on user, createdAt, and paymentStatus for efficient queries
 */
const OrderSchema = new Schema<IOrder>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    orderNumber: { type: Number, required: true, unique: true },
    items: {
      type: [OrderItemSchema],
      required: true,
      validate: {
        validator: (items: IOrderItem[]) => items.length > 0,
        message: "Order must have at least one item",
      },
    },
    subtotal: { type: Number, required: true, min: 0 },
    discountCode: { type: String, default: null },
    discountPercent: { type: Number, default: 0, min: 0, max: 100 },
    discountAmount: { type: Number, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    paymentId: { type: String, default: null },
    paymentStatus: {
      type: String,
      enum: ["pending", "completed", "failed"],
      default: "pending",
    },
    status: {
      type: String,
      enum: ["pending", "processing", "shipped", "delivered", "cancelled"],
      default: "pending",
    },
    shippingAddress: { type: ShippingAddressSchema, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient queries (unique on orderNumber is implicit)
OrderSchema.index({ createdAt: -1 });
OrderSchema.index({ paymentStatus: 1 });

/**
 * Order Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<IOrder>}
 */
const Order: Model<IOrder> =
  mongoose.models.Order || mongoose.model<IOrder>("Order", OrderSchema);

export default Order;

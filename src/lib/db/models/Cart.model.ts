/**
 * @fileoverview Cart Model - Shopping cart data model for the e-commerce platform
 *
 * This module defines the Mongoose schema and model for user shopping carts.
 * Each user has a single cart that persists across sessions and contains
 * product references, quantities, and optional discount codes.
 *
 * @module lib/db/models/Cart
 * @requires mongoose
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Cart item interface representing a single item in the shopping cart.
 *
 * @interface ICartItem
 * @property {mongoose.Types.ObjectId} product - Reference to the Product document
 * @property {number} quantity - Number of units (minimum 1)
 * @property {number} priceAtAdd - Price captured when item was added to cart
 */
export interface ICartItem {
  product: mongoose.Types.ObjectId;
  quantity: number;
  priceAtAdd: number;
}

/**
 * Cart document interface extending Mongoose Document.
 *
 * @interface ICart
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique cart identifier
 * @property {mongoose.Types.ObjectId} user - Reference to the User document (unique per user)
 * @property {ICartItem[]} items - Array of cart items
 * @property {mongoose.Types.ObjectId} [appliedDiscount] - Optional reference to applied DiscountCode
 * @property {Date} updatedAt - Timestamp of last update
 * @property {Date} createdAt - Timestamp of cart creation
 */
export interface ICart extends Document {
  _id: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  items: ICartItem[];
  appliedDiscount?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Schema for individual cart items.
 * Embedded within the Cart schema without its own _id.
 */
const CartItemSchema = new Schema<ICartItem>(
  {
    product: { type: Schema.Types.ObjectId, ref: "Product", required: true },
    quantity: {
      type: Number,
      required: true,
      min: [1, "Quantity must be at least 1"],
      default: 1,
    },
    priceAtAdd: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

/**
 * Main Cart schema with timestamps and unique user constraint.
 *
 * @description
 * - Each user can only have one cart (enforced by unique index on user field)
 * - Items array contains embedded CartItem subdocuments
 * - Applied discount is optional and references DiscountCode collection
 */
const CartSchema = new Schema<ICart>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    items: { type: [CartItemSchema], default: [] },
    appliedDiscount: {
      type: Schema.Types.ObjectId,
      ref: "DiscountCode",
      default: null,
    },
  },
  { timestamps: true }
);

// Note: No explicit index needed for 'user' - unique: true already creates one

/**
 * Cart Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<ICart>}
 */
const Cart: Model<ICart> =
  mongoose.models.Cart || mongoose.model<ICart>("Cart", CartSchema);

export default Cart;

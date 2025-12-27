/**
 * @fileoverview Discount Code Model - Discount/coupon code management
 *
 * This module defines the Mongoose schema for discount codes used in the
 * nth-order reward system. Discount codes are generated automatically for
 * every nth order and can also be manually created by administrators.
 *
 * @module lib/db/models/DiscountCode
 * @requires mongoose
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Discount code document interface extending Mongoose Document.
 *
 * @interface IDiscountCode
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique discount code identifier
 * @property {string} code - Unique uppercase discount code (e.g., "UNIBLOX-A1B2-C3D4")
 * @property {number} discountPercent - Discount percentage (1-100)
 * @property {boolean} isUsed - Whether the code has been redeemed
 * @property {mongoose.Types.ObjectId} [usedBy] - Reference to User who used the code
 * @property {Date} [usedAt] - Timestamp when code was redeemed
 * @property {number} generatedForOrder - Order number that triggered code generation
 * @property {Date} [expiresAt] - Optional expiration date
 * @property {Date} createdAt - Timestamp of code creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export interface IDiscountCode extends Document {
  _id: mongoose.Types.ObjectId;
  code: string;
  discountPercent: number;
  isUsed: boolean;
  usedBy?: mongoose.Types.ObjectId;
  usedAt?: Date;
  generatedForOrder: number;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Discount Code schema with validation and indexing.
 *
 * @description
 * - Code is auto-uppercased and trimmed
 * - Discount percentage must be between 1-100%
 * - Indexes on isUsed and expiresAt for efficient queries
 * - Virtual 'isValid' property for validation checks
 */
const DiscountCodeSchema = new Schema<IDiscountCode>(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true,
    },
    discountPercent: {
      type: Number,
      required: true,
      default: 10,
      min: [1, "Discount must be at least 1%"],
      max: [100, "Discount cannot exceed 100%"],
    },
    isUsed: { type: Boolean, default: false },
    usedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },
    usedAt: { type: Date, default: null },
    generatedForOrder: { type: Number, required: true },
    expiresAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// Indexes for efficient queries (unique on code is implicit)
DiscountCodeSchema.index({ isUsed: 1 });
DiscountCodeSchema.index({ expiresAt: 1 });

/**
 * Virtual property to check if discount code is currently valid.
 * A code is valid if it hasn't been used and hasn't expired.
 *
 * @returns {boolean} True if the code can be used
 * @example
 * const discount = await DiscountCode.findOne({ code: 'UNIBLOX-XXXX-XXXX' });
 * if (discount.isValid) {
 *   // Apply discount
 * }
 */
DiscountCodeSchema.virtual("isValid").get(function () {
  if (this.isUsed) return false;
  if (this.expiresAt && new Date() > this.expiresAt) return false;
  return true;
});

/**
 * DiscountCode Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<IDiscountCode>}
 */
const DiscountCode: Model<IDiscountCode> =
  mongoose.models.DiscountCode ||
  mongoose.model<IDiscountCode>("DiscountCode", DiscountCodeSchema);

export default DiscountCode;

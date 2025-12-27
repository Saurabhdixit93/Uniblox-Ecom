/**
 * @fileoverview Store Settings Model - Global application configuration
 *
 * This module defines the Mongoose schema for store-wide settings including
 * the nth-order discount configuration. Implements a singleton pattern to
 * ensure only one settings document exists in the database.
 *
 * @module lib/db/models/StoreSettings
 * @requires mongoose
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Store settings document interface extending Mongoose Document.
 *
 * @interface IStoreSettings
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique settings identifier
 * @property {number} nthOrderDiscount - Every nth order triggers discount generation (min 1, default 5)
 * @property {number} discountPercent - Discount percentage for generated codes (1-100, default 10)
 * @property {number} totalOrders - Running total of completed orders (used for nth-order logic)
 * @property {number} [defaultDiscountExpiry] - Optional default expiry in days for generated codes
 * @property {Date} updatedAt - Timestamp of last update
 * @property {Date} createdAt - Timestamp of settings creation
 */
export interface IStoreSettings extends Document {
  _id: mongoose.Types.ObjectId;
  nthOrderDiscount: number;
  discountPercent: number;
  totalOrders: number;
  defaultDiscountExpiry?: number;
  updatedAt: Date;
  createdAt: Date;
}

/**
 * Store Settings schema with validation.
 *
 * @description
 * - nthOrderDiscount controls the order frequency for automatic discounts
 * - discountPercent sets the discount value (1-100%)
 * - totalOrders tracks lifetime order count for nth-order calculations
 * - defaultDiscountExpiry sets automatic expiration for generated codes
 */
const StoreSettingsSchema = new Schema<IStoreSettings>(
  {
    nthOrderDiscount: {
      type: Number,
      required: true,
      default: 5,
      min: [1, "Must be at least 1"],
    },
    discountPercent: {
      type: Number,
      required: true,
      default: 10,
      min: [1, "Discount must be at least 1%"],
      max: [100, "Discount cannot exceed 100%"],
    },
    totalOrders: { type: Number, required: true, default: 0, min: 0 },
    defaultDiscountExpiry: {
      type: Number,
      default: null,
      min: [1, "Expiry must be at least 1 day"],
    },
  },
  { timestamps: true }
);

/**
 * StoreSettings Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<IStoreSettings>}
 */
const StoreSettings: Model<IStoreSettings> =
  mongoose.models.StoreSettings ||
  mongoose.model<IStoreSettings>("StoreSettings", StoreSettingsSchema);

export default StoreSettings;

/**
 * Retrieves or creates the singleton store settings document.
 *
 * This function implements a singleton pattern ensuring only one settings
 * document exists. If no settings are found, creates default settings.
 *
 * @async
 * @function getStoreSettings
 * @returns {Promise<IStoreSettings>} The store settings document
 * @example
 * const settings = await getStoreSettings();
 * console.log(`Discount every ${settings.nthOrderDiscount} orders`);
 *
 * // Update settings
 * settings.discountPercent = 15;
 * await settings.save();
 */
export async function getStoreSettings(): Promise<IStoreSettings> {
  let settings = await StoreSettings.findOne();
  if (!settings) {
    settings = await StoreSettings.create({
      nthOrderDiscount: 5,
      discountPercent: 10,
      totalOrders: 0,
    });
  }
  return settings;
}

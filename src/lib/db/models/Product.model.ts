/**
 * @fileoverview Product Model - E-commerce product catalog
 *
 * This module defines the Mongoose schema for products in the store.
 * Supports full-text search on name and description, category filtering,
 * stock management, and soft-delete via isActive flag.
 *
 * @module lib/db/models/Product
 * @requires mongoose
 */

import mongoose, { Schema, Document, Model } from "mongoose";

/**
 * Product document interface extending Mongoose Document.
 *
 * @interface IProduct
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique product identifier
 * @property {string} name - Product name (max 200 chars, required)
 * @property {string} description - Product description (max 2000 chars, required)
 * @property {number} price - Product price in INR (non-negative, required)
 * @property {string} image - Product image URL (required)
 * @property {string} category - Product category for filtering (required)
 * @property {number} stock - Available stock quantity (non-negative, default 0)
 * @property {boolean} isActive - Whether product is visible/available (default true)
 * @property {Date} createdAt - Timestamp of product creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Product schema with validation, text search, and indexing.
 *
 * @description
 * - Name and description support full-text search
 * - Category and isActive fields are indexed for filtering
 * - Soft-delete pattern via isActive flag
 */
const ProductSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, "Product name is required"],
      trim: true,
      maxlength: [200, "Product name cannot exceed 200 characters"],
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    price: {
      type: Number,
      required: [true, "Price is required"],
      min: [0, "Price cannot be negative"],
    },
    image: { type: String, required: [true, "Product image is required"] },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, "Stock cannot be negative"],
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// Indexes for efficient queries and search
ProductSchema.index({ category: 1 });
ProductSchema.index({ isActive: 1 });
ProductSchema.index({ name: "text", description: "text" });

/**
 * Product Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<IProduct>}
 */
const Product: Model<IProduct> =
  mongoose.models.Product || mongoose.model<IProduct>("Product", ProductSchema);

export default Product;

/**
 * @fileoverview User Model - User authentication and profile management
 *
 * This module defines the Mongoose schema for user accounts including
 * authentication with bcrypt password hashing, role-based access control,
 * and profile information.
 *
 * @module lib/db/models/User
 * @requires mongoose
 * @requires bcryptjs
 */

import mongoose, { Schema, Document, Model } from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User document interface extending Mongoose Document.
 *
 * @interface IUser
 * @extends {Document}
 * @property {mongoose.Types.ObjectId} _id - Unique user identifier
 * @property {string} email - User email address (unique, lowercase, required)
 * @property {string} password - Hashed password (select: false for security)
 * @property {string} name - User display name (min 2 chars, required)
 * @property {"customer"|"admin"} role - User role for access control
 * @property {Date} createdAt - Timestamp of account creation
 * @property {Date} updatedAt - Timestamp of last update
 */
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  email: string;
  password: string;
  name: string;
  role: "customer" | "admin";
  createdAt: Date;
  updatedAt: Date;

  /**
   * Compares a candidate password with the stored hashed password.
   *
   * @param {string} candidatePassword - Plain text password to verify
   * @returns {Promise<boolean>} True if password matches, false otherwise
   */
  comparePassword(candidatePassword: string): Promise<boolean>;
}

/**
 * User schema with validation, password hashing, and authentication methods.
 *
 * @description
 * - Email is auto-lowercased and validated with regex
 * - Password is automatically hashed before save using bcrypt (12 rounds)
 * - Password field is excluded from queries by default (select: false)
 * - Role defaults to 'customer' for new signups
 */
const UserSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, "Please provide a valid email"],
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [6, "Password must be at least 6 characters"],
      select: false, // Exclude from queries by default for security
    },
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    role: {
      type: String,
      enum: ["customer", "admin"],
      default: "customer",
    },
  },
  { timestamps: true }
);

/**
 * Pre-save middleware to hash password before storing.
 * Only hashes if password field is modified (new or changed).
 * Uses bcrypt with 12 salt rounds for security.
 */
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
});

/**
 * Instance method to compare passwords for authentication.
 *
 * @method comparePassword
 * @memberof IUser
 * @param {string} candidatePassword - Plain text password to verify
 * @returns {Promise<boolean>} True if password matches
 * @example
 * const user = await User.findOne({ email }).select('+password');
 * const isMatch = await user.comparePassword(inputPassword);
 * if (isMatch) {
 *   // Authenticate user
 * }
 */
UserSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

/**
 * User Mongoose model.
 * Uses cached model if already compiled (prevents OverwriteModelError in Next.js).
 *
 * @constant {Model<IUser>}
 */
const User: Model<IUser> =
  mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;

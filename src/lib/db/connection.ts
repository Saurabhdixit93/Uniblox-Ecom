/**
 * @fileoverview MongoDB Connection Manager - Database connection with caching
 *
 * This module provides a cached MongoDB connection using Mongoose.
 * Implements connection pooling and caching to prevent multiple connections
 * in serverless environments like Next.js API routes.
 *
 * @module lib/db/connection
 * @requires mongoose
 */

import mongoose, { Mongoose } from "mongoose";

/**
 * MongoDB connection URI from environment variables.
 * Must be set in .env.local or environment configuration.
 */
const NEXT_PUBLIC_MONGODB_URI = process.env.NEXT_PUBLIC_MONGODB_URI;

/**
 * Cache interface for storing the mongoose connection.
 *
 * @interface MongooseCache
 * @property {Mongoose|null} conn - The established Mongoose connection
 * @property {Promise<Mongoose>|null} promise - Pending connection promise
 */
interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

/**
 * Augment the global namespace to include mongoose cache.
 * Necessary for TypeScript type safety with global caching.
 */
declare global {
  var mongooseCache: MongooseCache | undefined;
}

/**
 * Initialize or retrieve the cached connection object.
 * Uses global scope to persist across hot reloads in development.
 */
const cached: MongooseCache = global.mongooseCache ?? {
  conn: null,
  promise: null,
};
if (!global.mongooseCache) global.mongooseCache = cached;

/**
 * Establishes a connection to MongoDB with caching.
 *
 * This function implements a singleton pattern for database connections:
 * 1. Returns existing connection if available
 * 2. Reuses pending connection promise if connection is in progress
 * 3. Creates new connection only when necessary
 *
 * The connection is cached globally to survive hot reloads in development
 * and prevent connection pool exhaustion in serverless environments.
 *
 * @async
 * @function connectDB
 * @returns {Promise<Mongoose>} The Mongoose connection instance
 * @throws {Error} If NEXT_PUBLIC_MONGODB_URI is not defined
 * @throws {Error} If connection fails (resets promise for retry)
 * @example
 * import { connectDB } from '@/lib/db/connection';
 *
 * export async function GET() {
 *   await connectDB();
 *   const users = await User.find({});
 *   return Response.json(users);
 * }
 */
export async function connectDB(): Promise<Mongoose> {
  // Validate environment variable
  if (!NEXT_PUBLIC_MONGODB_URI) {
    throw new Error("NEXT_PUBLIC_MONGODB_URI not defined");
  }

  // Return cached connection if available
  if (cached.conn) return cached.conn;

  // Create new connection promise if not already pending
  if (!cached.promise) {
    cached.promise = mongoose.connect(NEXT_PUBLIC_MONGODB_URI, {
      bufferCommands: false, // Fail immediately if not connected
    });
  }

  // Await and cache the connection
  try {
    cached.conn = await cached.promise;
  } catch (e) {
    // Reset promise on failure to allow retry
    cached.promise = null;
    throw e;
  }

  return cached.conn;
}

export default connectDB;

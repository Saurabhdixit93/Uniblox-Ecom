/**
 * Products API
 *
 * Handles product listing and retrieval
 *
 * @module app/api/products/route
 */

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/db/connection";
import Product from "@/lib/db/models/Product.model";

/**
 * GET /api/products
 *
 * Retrieves all active products with optional filtering
 *
 * Query parameters:
 * - category: Filter by category
 * - search: Search in name and description
 * - limit: Number of products to return (default: 50)
 * - page: Page number for pagination (default: 1)
 *
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} JSON response with products array
 */
export async function GET(request: NextRequest) {
  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const search = searchParams.get("search");
    const limit = parseInt(searchParams.get("limit") || "50");
    const page = parseInt(searchParams.get("page") || "1");

    // Build query
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const query: any = { isActive: true };

    if (category) {
      query.category = category;
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
      ];
    }

    // Execute query with pagination
    const skip = (page - 1) * limit;
    const [products, total] = await Promise.all([
      Product.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Product.countDocuments(query),
    ]);

    // Get unique categories
    const categories = await Product.distinct("category", { isActive: true });

    return NextResponse.json({
      success: true,
      products,
      categories,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Products fetch error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

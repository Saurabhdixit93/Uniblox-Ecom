/**
 * @fileoverview Utility Functions - Core helper functions for the e-commerce platform
 *
 * This module provides utility functions for discount code generation,
 * price formatting, discount calculations, and date operations.
 * All functions are pure and side-effect free.
 *
 * @module lib/utils
 * @requires uuid
 */

import { v4 as uuidv4 } from "uuid";

/**
 * Generates a unique discount code in the format UNIBLOX-XXXX-XXXX.
 * Uses UUID v4 for uniqueness and converts to uppercase.
 *
 * @function generateDiscountCode
 * @returns {string} Unique discount code (e.g., "UNIBLOX-A1B2-C3D4")
 * @example
 * const code = generateDiscountCode();
 * console.log(code); // "UNIBLOX-7F3A-9B2C"
 */
export function generateDiscountCode(): string {
  const uuid = uuidv4().replace(/-/g, "").toUpperCase();
  return `UNIBLOX-${uuid.slice(0, 4)}-${uuid.slice(4, 8)}`;
}

/**
 * Formats a numeric price in Indian Rupees (INR) currency format.
 * Uses the Indian numbering system with appropriate separators.
 *
 * @function formatPrice
 * @param {number} price - The price to format
 * @returns {string} Formatted price string (e.g., "₹1,23,456.78")
 * @example
 * formatPrice(1234.50);    // "₹1,234.5"
 * formatPrice(100000);     // "₹1,00,000"
 * formatPrice(0);          // "₹0"
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(price);
}

/**
 * Calculates the discount amount based on subtotal and percentage.
 * Rounds to 2 decimal places for currency precision.
 *
 * @function calculateDiscount
 * @param {number} subtotal - The original price before discount
 * @param {number} discountPercent - The discount percentage (0-100)
 * @returns {number} The calculated discount amount
 * @example
 * calculateDiscount(1000, 10);  // 100
 * calculateDiscount(333, 10);   // 33.3
 * calculateDiscount(500, 25);   // 125
 */
export function calculateDiscount(
  subtotal: number,
  discountPercent: number
): number {
  return Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
}

/**
 * Calculates a future expiry date from the current date.
 *
 * @function getExpiryDate
 * @param {number} days - Number of days from now until expiry
 * @returns {Date} The expiry date
 * @example
 * const expiry = getExpiryDate(7);  // 7 days from now
 * const expiry30 = getExpiryDate(30); // 30 days from now
 */
export function getExpiryDate(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date;
}

/**
 * Checks if a given date has passed (is expired).
 * Returns false for null/undefined dates (no expiry = never expires).
 *
 * @function isExpired
 * @param {Date|null|undefined} date - The date to check
 * @returns {boolean} True if the date is in the past, false otherwise
 * @example
 * isExpired(new Date('2020-01-01')); // true (past date)
 * isExpired(new Date('2030-01-01')); // false (future date)
 * isExpired(null);                   // false (no expiry)
 * isExpired(undefined);              // false (no expiry)
 */
export function isExpired(date: Date | null | undefined): boolean {
  if (!date) return false;
  return new Date() > new Date(date);
}

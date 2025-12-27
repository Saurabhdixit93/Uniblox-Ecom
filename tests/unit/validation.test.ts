/**
 * Validation Schema Unit Tests
 *
 * Tests for Zod validation schemas used in API routes
 */

import { z } from "zod";

/**
 * Test schemas matching those used in API routes
 */
const addToCartSchema = z.object({
  productId: z.string().min(1, "Product ID is required"),
  quantity: z.number().int().min(1, "Quantity must be at least 1"),
});

const checkoutShippingSchema = z.object({
  name: z.string().min(2),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().min(6),
  phone: z.string().min(10),
});

const userSignupSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

describe("Validation Schemas", () => {
  describe("addToCartSchema", () => {
    it("should validate correct input", () => {
      const result = addToCartSchema.safeParse({
        productId: "product-123",
        quantity: 2,
      });
      expect(result.success).toBe(true);
    });

    it("should reject empty productId", () => {
      const result = addToCartSchema.safeParse({
        productId: "",
        quantity: 1,
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Product ID is required");
      }
    });

    it("should reject zero quantity", () => {
      const result = addToCartSchema.safeParse({
        productId: "product-123",
        quantity: 0,
      });
      expect(result.success).toBe(false);
    });

    it("should reject negative quantity", () => {
      const result = addToCartSchema.safeParse({
        productId: "product-123",
        quantity: -1,
      });
      expect(result.success).toBe(false);
    });

    it("should reject non-integer quantity", () => {
      const result = addToCartSchema.safeParse({
        productId: "product-123",
        quantity: 1.5,
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = addToCartSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("checkoutShippingSchema", () => {
    const validAddress = {
      name: "John Doe",
      address: "123 Main Street",
      city: "Mumbai",
      state: "Maharashtra",
      pincode: "400001",
      phone: "9876543210",
    };

    it("should validate correct shipping address", () => {
      const result = checkoutShippingSchema.safeParse(validAddress);
      expect(result.success).toBe(true);
    });

    it("should reject short name", () => {
      const result = checkoutShippingSchema.safeParse({
        ...validAddress,
        name: "J",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short address", () => {
      const result = checkoutShippingSchema.safeParse({
        ...validAddress,
        address: "123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short pincode", () => {
      const result = checkoutShippingSchema.safeParse({
        ...validAddress,
        pincode: "400",
      });
      expect(result.success).toBe(false);
    });

    it("should reject short phone", () => {
      const result = checkoutShippingSchema.safeParse({
        ...validAddress,
        phone: "987654",
      });
      expect(result.success).toBe(false);
    });
  });

  describe("userSignupSchema", () => {
    it("should validate correct signup data", () => {
      const result = userSignupSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "securepass123",
      });
      expect(result.success).toBe(true);
    });

    it("should reject invalid email format", () => {
      const result = userSignupSchema.safeParse({
        name: "John Doe",
        email: "not-an-email",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe("Invalid email format");
      }
    });

    it("should reject short password", () => {
      const result = userSignupSchema.safeParse({
        name: "John Doe",
        email: "john@example.com",
        password: "12345",
      });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe(
          "Password must be at least 6 characters"
        );
      }
    });

    it("should reject short name", () => {
      const result = userSignupSchema.safeParse({
        name: "J",
        email: "john@example.com",
        password: "securepass123",
      });
      expect(result.success).toBe(false);
    });

    it("should reject missing fields", () => {
      const result = userSignupSchema.safeParse({
        email: "john@example.com",
      });
      expect(result.success).toBe(false);
    });
  });
});

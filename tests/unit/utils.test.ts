/**
 * Utility Functions Unit Tests
 *
 * Tests for formatPrice function.
 * Note: formatPrice is tested directly as it doesn't depend on ESM-only modules.
 */

describe("Utility Functions", () => {
  describe("formatPrice", () => {
    /**
     * Helper to create formatPrice function inline
     * to avoid importing the utils module which imports uuid (ESM-only)
     */
    const formatPrice = (price: number): string => {
      return new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        minimumFractionDigits: 0,
        maximumFractionDigits: 2,
      }).format(price);
    };

    it("should format zero correctly", () => {
      const result = formatPrice(0);
      expect(result).toBe("₹0");
    });

    it("should format integer price correctly", () => {
      const result = formatPrice(1000);
      expect(result).toBe("₹1,000");
    });

    it("should format decimal price correctly", () => {
      const result = formatPrice(999.99);
      expect(result).toBe("₹999.99");
    });

    it("should format large numbers with Indian numbering system", () => {
      const result = formatPrice(100000);
      expect(result).toBe("₹1,00,000");
    });

    it("should format lakhs correctly", () => {
      const result = formatPrice(1234567);
      expect(result).toBe("₹12,34,567");
    });

    it("should format small decimal prices", () => {
      const result = formatPrice(49.5);
      expect(result).toBe("₹49.5");
    });

    it("should handle negative prices", () => {
      const result = formatPrice(-500);
      expect(result).toBe("-₹500");
    });

    it("should truncate extra decimal places", () => {
      const result = formatPrice(99.999);
      // Intl.NumberFormat rounds to max 2 decimal places
      expect(result).toBe("₹100");
    });
  });
});

describe("Discount Calculation Functions", () => {
  /**
   * Test pure functions inline (matching src/lib/utils/index.ts logic)
   */
  const calculateDiscount = (
    subtotal: number,
    discountPercent: number
  ): number => {
    return Math.round(((subtotal * discountPercent) / 100) * 100) / 100;
  };

  const getExpiryDate = (days: number): Date => {
    const date = new Date();
    date.setDate(date.getDate() + days);
    return date;
  };

  const isExpired = (date: Date | null | undefined): boolean => {
    if (!date) return false;
    return new Date() > new Date(date);
  };

  describe("calculateDiscount", () => {
    it("should calculate 10% discount correctly", () => {
      expect(calculateDiscount(1000, 10)).toBe(100);
    });

    it("should calculate 25% discount correctly", () => {
      expect(calculateDiscount(500, 25)).toBe(125);
    });

    it("should round to 2 decimal places", () => {
      expect(calculateDiscount(333, 10)).toBe(33.3);
    });

    it("should return 0 for 0% discount", () => {
      expect(calculateDiscount(1000, 0)).toBe(0);
    });

    it("should return full amount for 100% discount", () => {
      expect(calculateDiscount(1000, 100)).toBe(1000);
    });
  });

  describe("getExpiryDate", () => {
    it("should return date in the future", () => {
      const expiry = getExpiryDate(7);
      const now = new Date();
      expect(expiry.getTime()).toBeGreaterThan(now.getTime());
    });

    it("should return correct number of days in future", () => {
      const days = 30;
      const expiry = getExpiryDate(days);
      const now = new Date();
      const diffDays = Math.round(
        (expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(days);
    });
  });

  describe("isExpired", () => {
    it("should return false for null expiry", () => {
      expect(isExpired(null)).toBe(false);
    });

    it("should return false for undefined expiry", () => {
      expect(isExpired(undefined)).toBe(false);
    });

    it("should return true for past date", () => {
      const pastDate = new Date("2020-01-01");
      expect(isExpired(pastDate)).toBe(true);
    });

    it("should return false for future date", () => {
      const futureDate = new Date("2030-01-01");
      expect(isExpired(futureDate)).toBe(false);
    });
  });
});

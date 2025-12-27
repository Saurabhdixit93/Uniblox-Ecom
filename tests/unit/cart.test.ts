/**
 * Cart Logic Unit Tests
 *
 * Tests for cart calculations and operations
 */

describe("Cart Calculations", () => {
  interface CartItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
  }

  const calculateSubtotal = (items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  const calculateTotal = (
    subtotal: number,
    discountPercent: number = 0
  ): number => {
    const discountAmount = (subtotal * discountPercent) / 100;
    return subtotal - discountAmount;
  };

  const calculateItemCount = (items: CartItem[]): number => {
    return items.reduce((sum, item) => sum + item.quantity, 0);
  };

  describe("calculateSubtotal", () => {
    it("should calculate subtotal correctly for single item", () => {
      const items = [
        { productId: "1", name: "Product 1", price: 100, quantity: 2 },
      ];

      expect(calculateSubtotal(items)).toBe(200);
    });

    it("should calculate subtotal correctly for multiple items", () => {
      const items = [
        { productId: "1", name: "Product 1", price: 100, quantity: 2 },
        { productId: "2", name: "Product 2", price: 50, quantity: 3 },
      ];

      expect(calculateSubtotal(items)).toBe(350);
    });

    it("should return 0 for empty cart", () => {
      const items: CartItem[] = [];

      expect(calculateSubtotal(items)).toBe(0);
    });
  });

  describe("calculateTotal", () => {
    it("should return subtotal when no discount", () => {
      expect(calculateTotal(1000, 0)).toBe(1000);
    });

    it("should apply 10% discount correctly", () => {
      expect(calculateTotal(1000, 10)).toBe(900);
    });

    it("should apply 25% discount correctly", () => {
      expect(calculateTotal(400, 25)).toBe(300);
    });
  });

  describe("calculateItemCount", () => {
    it("should count total items correctly", () => {
      const items = [
        { productId: "1", name: "Product 1", price: 100, quantity: 2 },
        { productId: "2", name: "Product 2", price: 50, quantity: 3 },
      ];

      expect(calculateItemCount(items)).toBe(5);
    });

    it("should return 0 for empty cart", () => {
      expect(calculateItemCount([])).toBe(0);
    });
  });
});

describe("Cart Operations", () => {
  interface CartItem {
    productId: string;
    quantity: number;
  }

  const addToCart = (
    items: CartItem[],
    productId: string,
    quantity: number
  ): CartItem[] => {
    const existingIndex = items.findIndex((i) => i.productId === productId);

    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
      return updated;
    }

    return [...items, { productId, quantity }];
  };

  const removeFromCart = (items: CartItem[], productId: string): CartItem[] => {
    return items.filter((i) => i.productId !== productId);
  };

  const updateQuantity = (
    items: CartItem[],
    productId: string,
    quantity: number
  ): CartItem[] => {
    return items.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
  };

  describe("addToCart", () => {
    it("should add new item to empty cart", () => {
      const result = addToCart([], "product-1", 1);

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe("product-1");
      expect(result[0].quantity).toBe(1);
    });

    it("should increase quantity for existing item", () => {
      const items = [{ productId: "product-1", quantity: 2 }];
      const result = addToCart(items, "product-1", 3);

      expect(result).toHaveLength(1);
      expect(result[0].quantity).toBe(5);
    });

    it("should add different product as new item", () => {
      const items = [{ productId: "product-1", quantity: 2 }];
      const result = addToCart(items, "product-2", 1);

      expect(result).toHaveLength(2);
    });
  });

  describe("removeFromCart", () => {
    it("should remove item from cart", () => {
      const items = [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ];
      const result = removeFromCart(items, "product-1");

      expect(result).toHaveLength(1);
      expect(result[0].productId).toBe("product-2");
    });

    it("should return empty array when removing last item", () => {
      const items = [{ productId: "product-1", quantity: 2 }];
      const result = removeFromCart(items, "product-1");

      expect(result).toHaveLength(0);
    });
  });

  describe("updateQuantity", () => {
    it("should update quantity for specific item", () => {
      const items = [
        { productId: "product-1", quantity: 2 },
        { productId: "product-2", quantity: 1 },
      ];
      const result = updateQuantity(items, "product-1", 5);

      expect(result[0].quantity).toBe(5);
      expect(result[1].quantity).toBe(1);
    });
  });
});

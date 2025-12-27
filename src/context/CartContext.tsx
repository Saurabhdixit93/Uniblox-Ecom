/**
 * Cart Context
 *
 * Global state management for shopping cart
 * Provides cart data and operations across the application
 *
 * @module context/CartContext
 */

"use client";

import React, {
  createContext,
  useContext,
  useReducer,
  useCallback,
  useEffect,
} from "react";

/**
 * Cart item interface
 */
interface CartItem {
  productId: string;
  name: string;
  price: number;
  image: string;
  quantity: number;
  stock: number;
  total: number;
}

/**
 * Applied discount interface
 */
interface AppliedDiscount {
  code: string;
  percent: number;
}

/**
 * Cart state interface
 */
interface CartState {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  discount: AppliedDiscount | null;
  discountAmount: number;
  total: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Cart action types
 */
type CartAction =
  | { type: "SET_LOADING"; payload: boolean }
  | { type: "SET_ERROR"; payload: string | null }
  | { type: "SET_CART"; payload: Omit<CartState, "isLoading" | "error"> }
  | { type: "CLEAR_CART" };

/**
 * Cart context interface
 */
interface CartContextType extends CartState {
  fetchCart: () => Promise<void>;
  addToCart: (productId: string, quantity?: number) => Promise<boolean>;
  updateQuantity: (productId: string, quantity: number) => Promise<boolean>;
  removeItem: (productId: string) => Promise<boolean>;
  applyDiscount: (
    code: string
  ) => Promise<{ success: boolean; error?: string }>;
  removeDiscount: () => Promise<boolean>;
  clearCart: () => Promise<void>;
}

/**
 * Initial cart state
 */
const initialState: CartState = {
  items: [],
  itemCount: 0,
  subtotal: 0,
  discount: null,
  discountAmount: 0,
  total: 0,
  isLoading: false,
  error: null,
};

/**
 * Cart reducer
 */
function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_ERROR":
      return { ...state, error: action.payload, isLoading: false };
    case "SET_CART":
      return { ...state, ...action.payload, isLoading: false, error: null };
    case "CLEAR_CART":
      return { ...initialState };
    default:
      return state;
  }
}

/**
 * Cart context
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Cart provider component
 * Wraps the application to provide cart functionality
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, initialState);

  /**
   * Fetches cart data from API
   */
  const fetchCart = useCallback(async () => {
    dispatch({ type: "SET_LOADING", payload: true });

    try {
      const response = await fetch("/api/cart");
      const data = await response.json();

      if (data.success) {
        dispatch({
          type: "SET_CART",
          payload: data.cart,
        });
      } else {
        dispatch({ type: "SET_ERROR", payload: data.error });
      }
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to fetch cart" });
    }
  }, []);

  /**
   * Adds item to cart
   */
  const addToCart = useCallback(
    async (productId: string, quantity = 1): Promise<boolean> => {
      try {
        const response = await fetch("/api/cart", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId, quantity }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchCart();
          return true;
        }

        dispatch({ type: "SET_ERROR", payload: data.error });
        return false;
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to add item" });
        return false;
      }
    },
    [fetchCart]
  );

  /**
   * Updates item quantity
   */
  const updateQuantity = useCallback(
    async (productId: string, quantity: number): Promise<boolean> => {
      try {
        const response = await fetch(`/api/cart/${productId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchCart();
          return true;
        }

        dispatch({ type: "SET_ERROR", payload: data.error });
        return false;
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to update quantity" });
        return false;
      }
    },
    [fetchCart]
  );

  /**
   * Removes item from cart
   */
  const removeItem = useCallback(
    async (productId: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/cart/${productId}`, {
          method: "DELETE",
        });

        const data = await response.json();

        if (data.success) {
          await fetchCart();
          return true;
        }

        dispatch({ type: "SET_ERROR", payload: data.error });
        return false;
      } catch {
        dispatch({ type: "SET_ERROR", payload: "Failed to remove item" });
        return false;
      }
    },
    [fetchCart]
  );

  /**
   * Applies discount code
   */
  const applyDiscount = useCallback(
    async (code: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const response = await fetch("/api/cart/discount", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await response.json();

        if (data.success) {
          await fetchCart();
          return { success: true };
        }

        return { success: false, error: data.error };
      } catch {
        return { success: false, error: "Failed to apply discount" };
      }
    },
    [fetchCart]
  );

  /**
   * Removes applied discount
   */
  const removeDiscount = useCallback(async (): Promise<boolean> => {
    try {
      const response = await fetch("/api/cart/discount", {
        method: "DELETE",
      });

      const data = await response.json();

      if (data.success) {
        await fetchCart();
        return true;
      }

      return false;
    } catch {
      return false;
    }
  }, [fetchCart]);

  /**
   * Clears the entire cart
   */
  const clearCart = useCallback(async () => {
    try {
      await fetch("/api/cart", { method: "DELETE" });
      dispatch({ type: "CLEAR_CART" });
    } catch {
      dispatch({ type: "SET_ERROR", payload: "Failed to clear cart" });
    }
  }, []);

  // Fetch cart on mount
  useEffect(() => {
    fetchCart();
  }, [fetchCart]);

  const value: CartContextType = {
    ...state,
    fetchCart,
    addToCart,
    updateQuantity,
    removeItem,
    applyDiscount,
    removeDiscount,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

/**
 * Hook to access cart context
 *
 * @returns {CartContextType} Cart context value
 * @throws {Error} If used outside of CartProvider
 */
export function useCart(): CartContextType {
  const context = useContext(CartContext);

  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }

  return context;
}

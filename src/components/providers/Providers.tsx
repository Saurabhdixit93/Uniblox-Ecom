/**
 * Root Providers
 *
 * Combines all context providers for the application
 *
 * @module components/providers/Providers
 */

"use client";

import { SessionProvider } from "next-auth/react";
import { Toaster } from "react-hot-toast";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";

/**
 * Providers component
 * Wraps the application with all necessary context providers
 */
export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <AuthProvider>
        <CartProvider>
          {children}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3000,
              style: {
                background: "var(--toast-bg)",
                color: "var(--toast-text)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 10px 40px rgba(0, 0, 0, 0.2)",
              },
              success: {
                iconTheme: {
                  primary: "#10B981",
                  secondary: "#fff",
                },
              },
              error: {
                iconTheme: {
                  primary: "#EF4444",
                  secondary: "#fff",
                },
              },
            }}
          />
        </CartProvider>
      </AuthProvider>
    </SessionProvider>
  );
}

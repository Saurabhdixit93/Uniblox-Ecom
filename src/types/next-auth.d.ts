/**
 * Auth Type Extensions
 *
 * Extends NextAuth types to include custom user properties
 *
 * @module types/next-auth.d
 */

import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface User {
    id: string;
    role: "customer" | "admin";
  }

  interface Session {
    user: {
      id: string;
      email: string;
      name: string;
      role: "customer" | "admin";
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "customer" | "admin";
  }
}

/**
 * @fileoverview NextAuth.js Configuration - Authentication setup for the application
 *
 * This module configures NextAuth.js v5 (Auth.js) with credentials provider
 * for email/password authentication, JWT session strategy, and role-based
 * access control via custom callbacks.
 *
 * @module lib/auth/auth.config
 * @requires next-auth
 */

import type { NextAuthConfig } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { connectDB } from "@/lib/db/connection";
import User from "@/lib/db/models/User.model";

/**
 * NextAuth configuration object.
 *
 * @description
 * - Uses credentials provider for email/password authentication
 * - JWT session strategy with 30-day max age
 * - Custom callbacks to include user ID and role in session
 * - Custom sign-in page at /login
 *
 * @type {NextAuthConfig}
 */
export const authConfig: NextAuthConfig = {
  /**
   * Authentication providers configuration.
   * Currently uses credentials provider only.
   */
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      /**
       * Authorize callback - validates user credentials.
       *
       * @param {Object} credentials - User-provided credentials
       * @param {string} credentials.email - User email
       * @param {string} credentials.password - User password
       * @returns {Promise<Object|null>} User object if valid, null otherwise
       * @throws {Error} If credentials are invalid
       */
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        await connectDB();

        const user = await User.findOne({ email: credentials.email }).select(
          "+password"
        );
        if (!user) throw new Error("No user found with this email");

        const isPasswordValid = await user.comparePassword(
          credentials.password as string
        );
        if (!isPasswordValid) throw new Error("Invalid password");

        return {
          id: user._id.toString(),
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],

  /**
   * Callbacks for customizing authentication flow.
   */
  callbacks: {
    /**
     * JWT callback - adds user data to the token.
     * Called whenever a JWT is created or updated.
     */
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },

    /**
     * Session callback - adds token data to the session.
     * This data is available via useSession() on the client.
     */
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as "customer" | "admin";
      }
      return session;
    },
  },

  /**
   * Custom pages configuration.
   */
  pages: {
    signIn: "/login",
    error: "/login",
  },

  /**
   * Session configuration using JWT strategy.
   * Sessions expire after 30 days.
   */
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },

  /** Trust the host for CSRF checks */
  trustHost: true,
};

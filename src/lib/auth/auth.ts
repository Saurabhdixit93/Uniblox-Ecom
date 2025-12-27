/**
 * @fileoverview NextAuth.js Entry Point - Exports authentication handlers
 *
 * This module initializes NextAuth.js and exports authentication utilities
 * for use throughout the application. Import from this module for all
 * authentication needs.
 *
 * @module lib/auth/auth
 * @requires next-auth
 */

import NextAuth from "next-auth";
import { authConfig } from "./auth.config";

/**
 * NextAuth.js exports for authentication.
 *
 * @exports handlers - API route handlers for /api/auth/*
 * @exports auth - Server-side session getter function
 * @exports signIn - Server-side sign-in function
 * @exports signOut - Server-side sign-out function
 *
 * @example
 * // In API routes - get current session
 * import { auth } from '@/lib/auth/auth';
 * const session = await auth();
 *
 * @example
 * // In API route handler
 * import { handlers } from '@/lib/auth/auth';
 * export const { GET, POST } = handlers;
 */
export const { handlers, auth, signIn, signOut } = NextAuth(authConfig);

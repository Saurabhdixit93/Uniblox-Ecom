/**
 * NextAuth API Route Handler
 *
 * Handles all authentication-related routes:
 * - /api/auth/signin
 * - /api/auth/signout
 * - /api/auth/session
 * - /api/auth/callback/*
 *
 * @module app/api/auth/[...nextauth]/route
 */

import { handlers } from "@/lib/auth/auth";

export const { GET, POST } = handlers;

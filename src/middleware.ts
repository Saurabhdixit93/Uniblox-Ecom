import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

/**
 * Force Node.js runtime instead of Edge
 * @type {string}
 */
export const runtime = "nodejs";

/**
 * Middleware function to handle authentication and authorization
 * @param {NextRequest} request - The incoming request
 * @returns {Promise<NextResponse>} The response to send to the client
 */
export async function middleware(request: NextRequest) {
  // Determine if running in secure context (HTTPS)
  const isSecure = request.url.startsWith("https://");

  // NextAuth v5 uses different cookie names for secure/non-secure contexts
  const cookieName = isSecure
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
    cookieName,
  });
  const { pathname } = request.nextUrl;

  // Admin routes require admin role
  if (pathname.startsWith("/admin")) {
    if (!token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (token.role !== "admin") {
      return NextResponse.redirect(new URL("/", request.url));
    }
  }

  // Redirect logged-in users away from auth pages
  if ((pathname === "/login" || pathname === "/signup") && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/signup"],
};

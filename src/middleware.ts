import { NextResponse, type NextRequest } from "next/server";

/**
 * Edge middleware — first line of defence on /dashboard/*.
 *
 * Checks only for the PRESENCE of an Auth.js session cookie. It does not
 * verify the signature, decode the JWT, or look at roles.
 *
 * WHY SO SHALLOW:
 * Middleware runs on the Edge runtime, which can't load Prisma (native
 * bindings) and shouldn't be doing crypto on every asset request. Importing
 * the full `auth` object here also drags the whole Node-only auth config into
 * the edge bundle and breaks the build.
 *
 * So this is a cheap early-out for obviously-signed-out visitors. Anyone
 * holding a forged or expired cookie sails straight through — and is then
 * stopped by the two layers that actually matter:
 *
 *   1. this file                — cheap, edge, presence-only
 *   2. dashboard/layout.tsx     — real session decode, server-side
 *   3. every mutating API route — requireUser() / requireAdmin()
 *
 * Never treat layer 1 as security.
 */

/** Cookie names Auth.js v5 uses, depending on protocol. */
const SESSION_COOKIES = [
  "authjs.session-token",
  "__Secure-authjs.session-token",
  // v4-era names, harmless to keep during migration
  "next-auth.session-token",
  "__Secure-next-auth.session-token",
];

export default function middleware(request: NextRequest) {
  // Dev preview bypass — mirrors getCurrentUser(). Without this, setting
  // DEV_PREVIEW_ROLE would still bounce you at the edge before the layout
  // ever got a chance to honour it.
  if (
    process.env.NODE_ENV !== "production" &&
    (process.env.DEV_PREVIEW_ROLE === "admin" ||
      process.env.DEV_PREVIEW_ROLE === "editor")
  ) {
    return NextResponse.next();
  }

  const hasSession = SESSION_COOKIES.some(
    (name) => request.cookies.get(name)?.value
  );

  if (!hasSession) {
    const url = new URL("/login", request.url);
    // Preserve intent so the user lands where they were headed after signing in.
    url.searchParams.set("from", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};

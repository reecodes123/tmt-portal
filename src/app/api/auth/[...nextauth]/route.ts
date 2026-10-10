/**
 * Auth.js (NextAuth v5) catch-all route.
 *
 * Handles /api/auth/signin, /api/auth/callback/credentials, /api/auth/session,
 * /api/auth/csrf and /api/auth/signout. The client-side `signIn()` helper
 * posts here.
 */
import { handlers } from "@/server/auth";

export const { GET, POST } = handlers;

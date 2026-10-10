/**
 * Authentication — Auth.js (NextAuth v5) with credentials against MySQL.
 *
 * Editors and admins sign in with email + password. The password is compared
 * with bcrypt against `users.passwordHash`. Readers never authenticate.
 *
 * SERVER ONLY. Do not import from a Client Component.
 *
 * ─────────────────────────────────────────────────────────────────────────
 * WHY JWT SESSIONS AND NOT DATABASE SESSIONS
 *
 * Auth.js does not support the Credentials provider with
 * `session.strategy: "database"`. The adapter's session flow is driven by
 * OAuth callbacks, which credentials sign-in never triggers — so the session
 * row is never created and the user appears signed out immediately.
 *
 * An earlier draft of this file specified `strategy: "database"` alongside a
 * Credentials provider. That combination silently fails. JWT is the correct
 * strategy here, and it's also the better fit for Vercel: sessions are
 * stateless, so there's no DB round-trip on every request.
 *
 * The `sessions` and `accounts` tables stay in the schema. They cost nothing
 * empty, and they're required the moment Google SSO is added — at which point
 * the adapter gets attached for that provider only.
 * ─────────────────────────────────────────────────────────────────────────
 */

import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { cache } from "react";
import { prisma } from "./db";
import type { AppUser, UserRole } from "@/types/domain";

/** Inactivity window before a session expires. */
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

/**
 * A real bcrypt hash (cost 12) of a random throwaway string, compared against
 * when the submitted email doesn't exist. See the note in authorize().
 * Nothing can ever match it.
 */
const DUMMY_PASSWORD_HASH =
  "$2b$12$/ez.EQ/AvLCygwrF2Ia4YuP3iYdJdffdKO8MqHm2QueWFOImuDYPu";

export const { handlers, auth, signIn, signOut } = NextAuth({
  session: {
    strategy: "jwt",
    maxAge: SESSION_MAX_AGE_SECONDS,
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    Credentials({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "")
          .trim()
          .toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        const user = await prisma.user.findUnique({ where: { email } });

        // Run a real bcrypt comparison even when the user doesn't exist.
        //
        // This hash must be a GENUINE bcrypt string. An earlier version used a
        // made-up placeholder, and because bcrypt rejects malformed hashes
        // immediately, "unknown email" returned in ~0.7ms while "wrong
        // password" took ~358ms — a 500x gap that reliably reveals which
        // addresses are registered. With a real cost-12 hash both paths do the
        // same work and the timings converge.
        //
        // It is the hash of a random throwaway string; nothing can match it.
        const hash = user?.passwordHash ?? DUMMY_PASSWORD_HASH;
        const passwordMatches = await bcrypt.compare(password, hash);

        if (!user || !passwordMatches) return null;
        if (!user.active) return null;
        if (user.role !== "editor" && user.role !== "admin") return null;

        return {
          id: user.id,
          email: user.email,
          name: user.displayName,
          image: user.avatarUrl,
          role: user.role,
          sessionVersion: (user as { sessionVersion: number }).sessionVersion,
        };
      },
    }),
  ],
  callbacks: {
    /**
     * Runs on sign-in and on every token refresh. `user` is only populated on
     * the initial sign-in, so role/id are copied onto the token once and then
     * carried forward.
     */
    jwt({ token, user }) {
      if (user) {
        token.id = user.id as string;
        token.role = (user as { role: UserRole }).role;
        token.sessionVersion = (user as unknown as { sessionVersion: number }).sessionVersion;
      }
      return token;
    },

    /** Projects the token onto the session object the app actually reads. */
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as UserRole;
        session.user.sessionVersion = token.sessionVersion as number | undefined;
      }
      return session;
    },
  },
});

export type SessionUser = Pick<
  AppUser,
  | "id"
  | "email"
  | "displayName"
  | "role"
  | "active"
  | "avatarUrl"
  | "canApproveArticles"
>;

/**
 * Returns the signed-in user, or null.
 *
 * Every caller handles null by redirecting to /login, so the app fails closed.
 *
 * WHY THIS RE-QUERIES THE DATABASE ON EVERY CALL
 * ------------------------------------------------
 * Session strategy is JWT (see the file-top note on why), which means
 * `session.user.role` is a snapshot copied onto the token once, at sign-in
 * (see the `jwt()` callback above), and then carried forward unchanged in the
 * signed cookie for up to SESSION_MAX_AGE_SECONDS. Trusting that snapshot
 * here would mean: an admin demotes an editor to reader-equivalent, or
 * deactivates their account entirely, in the dashboard's Users page — and the
 * change is correctly written to `users.role`/`users.active` immediately —
 * but the *target user's own already-open session* keeps its old, stale
 * privileges until their JWT naturally expires (up to 8 hours) or they sign
 * out. For a deactivated account that's a real access-control gap, not just
 * a UX one.
 *
 * So this always re-reads the authoritative row from `users` by the id the
 * JWT vouches for, and fails closed (returns null) if the account is gone or
 * inactive. `cache()` (React's per-request memoization, not a cross-request
 * cache) means calling this several times in one request — a layout plus a
 * page, for instance — costs one indexed primary-key lookup, not several.
 *
 * DEV PREVIEW ESCAPE HATCH
 * ------------------------
 * Setting `DEV_PREVIEW_ROLE=admin` (or `editor`) in .env lets you view the
 * dashboard without signing in — useful for frontend work. It is ignored
 * entirely when NODE_ENV === "production", so it cannot leak to a deployment.
 *
 * Now that real authentication works, this is optional. Delete the block and
 * the env var when you no longer want it.
 */
export const getCurrentUser = cache(async (): Promise<SessionUser | null> => {
  const session = await auth();

  if (session?.user?.id) {
    const dbUser = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    // Account deleted, or deactivated since this JWT was issued — the token
    // itself is still validly signed, so only a fresh DB check can catch this.
    if (
      !dbUser ||
      !dbUser.active ||
      (session.user.sessionVersion ?? 0) !== dbUser.sessionVersion
    ) return null;

    return {
      id: dbUser.id,
      email: dbUser.email,
      displayName: dbUser.displayName,
      role: dbUser.role,
      active: dbUser.active,
      avatarUrl: dbUser.avatarUrl,
      canApproveArticles: dbUser.canApproveArticles,
    };
  }

  if (process.env.NODE_ENV !== "production") {
    const previewRole = process.env.DEV_PREVIEW_ROLE;
    if (previewRole === "admin" || previewRole === "editor") {
      return {
        id: `dev-preview-${previewRole}`,
        email:
          previewRole === "admin"
            ? "eic@marsu.edu.ph"
            : "editor@marsu.edu.ph",
        displayName:
          previewRole === "admin" ? "Thea Pondevida (preview)" : "Preview Editor",
        role: previewRole,
        active: true,
        avatarUrl: null,
        // Dev-preview is a frontend-exploration shortcut, not a real account
        // — it should never simulate delegated approval authority.
        canApproveArticles: false,
      };
    }
  }

  return null;
});

/** Throws unless a user is signed in. Use at the top of protected API routes. */
export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) {
    throw new AuthError("You must be signed in to do that.", 401);
  }
  return user;
}

/** Throws unless the signed-in user is an admin. */
export async function requireAdmin(): Promise<SessionUser> {
  const user = await requireUser();
  if (user.role !== "admin") {
    throw new AuthError("Administrator access is required.", 403);
  }
  return user;
}

export class AuthError extends Error {
  constructor(
    message: string,
    public readonly status: 401 | 403
  ) {
    super(message);
    this.name = "AuthError";
  }
}

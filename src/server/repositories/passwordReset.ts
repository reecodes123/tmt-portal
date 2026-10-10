/**
 * Password-reset token lifecycle. SERVER ONLY.
 *
 * Reuses the `VerificationToken` table that was already in the schema for
 * exactly this ("Single-use tokens for password reset.") rather than adding
 * a parallel model — same `identifier`/`token`/`expires` shape Auth.js's own
 * adapter uses for the same kind of thing.
 *
 * SECURITY NOTES
 *   - The DB never stores the raw token, only its SHA-256 hash — the same
 *     reasoning as storing a bcrypt hash instead of a plaintext password: a
 *     read-only DB leak (backup, dump, misconfigured access) shouldn't hand
 *     out working reset links. The raw token exists only in the emailed URL.
 *   - `createPasswordResetToken` returns null for "no such account" AND for
 *     "account exists but is deactivated", and the API route that calls it
 *     returns the exact same generic response either way — mirrors the
 *     constant-time login comparison in auth.ts; this is the same principle
 *     applied to "does this email have an account" instead of "is this
 *     password right".
 */

import { randomBytes, createHash } from "crypto";
import { prisma } from "@/server/db";
import { updatePassword } from "./users";

const TOKEN_BYTES = 32;
const EXPIRY_MINUTES = 30;

function hashToken(rawToken: string): string {
  return createHash("sha256").update(rawToken).digest("hex");
}

export async function createPasswordResetToken(
  email: string
): Promise<{ token: string; expires: Date; displayName: string } | null> {
  const identifier = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: identifier } });

  if (!user || !user.active) return null;

  const rawToken = randomBytes(TOKEN_BYTES).toString("hex");
  const expires = new Date(Date.now() + EXPIRY_MINUTES * 60 * 1000);

  // One live reset link per account — issuing a new one invalidates any
  // earlier, still-unused request rather than leaving multiple valid links.
  await prisma.$transaction([
    prisma.verificationToken.deleteMany({ where: { identifier } }),
    prisma.verificationToken.create({
      data: { identifier, token: hashToken(rawToken), expires },
    }),
  ]);

  return { token: rawToken, expires, displayName: user.displayName };
}

/**
 * Validates + consumes a reset token and sets the new password in one step.
 * Returns false for any failure (expired, unknown, already used, account
 * deactivated since the email was sent) — deliberately one boolean rather
 * than distinguishing the reasons, since the token itself is a secret only
 * its recipient has, so there's no enumeration concern here, but there's
 * also no legitimate reason for a caller to branch on *why* it failed.
 */
export async function resetPasswordWithToken(
  rawToken: string,
  newPassword: string
): Promise<boolean> {
  const hashed = hashToken(rawToken);
  const record = await prisma.verificationToken.findUnique({
    where: { token: hashed },
  });

  if (!record) return false;

  // Single-use regardless of outcome below — a token that's expired or
  // points at a since-deactivated account shouldn't remain retriable.
  await prisma.verificationToken.delete({ where: { token: hashed } });

  if (record.expires < new Date()) return false;

  const user = await prisma.user.findUnique({
    where: { email: record.identifier },
  });
  if (!user || !user.active) return false;

  await updatePassword(user.id, newPassword);
  return true;
}

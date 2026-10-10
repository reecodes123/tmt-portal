/**
 * User (editor/admin account) data access. SERVER ONLY.
 *
 * Two prototype workarounds are gone here: creating an account no longer
 * needs a "secondary Firebase app" to avoid signing out the admin, and
 * deactivation is a real DB write rather than a flag the client couldn't
 * enforce.
 */

import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { AppUser } from "@/types/domain";
import type { CreateUserBody, UpdateUserBody } from "@/types/api";
import { ConflictError } from "@/app/api/_helpers";
import { toAppUser } from "./_mappers";

const BCRYPT_ROUNDS = 12;

export async function listUsers(): Promise<AppUser[]> {
  const rows = await prisma.user.findMany({ orderBy: { createdAt: "desc" } });
  return rows.map(toAppUser);
}

export async function getUserById(id: string): Promise<AppUser | null> {
  const row = await prisma.user.findUnique({ where: { id } });
  return row ? toAppUser(row) : null;
}

export async function getUserByEmail(email: string): Promise<AppUser | null> {
  const row = await prisma.user.findUnique({
    where: { email: email.trim().toLowerCase() },
  });
  return row ? toAppUser(row) : null;
}

/**
 * Always creates an Editor account — role is never taken from the caller
 * (see CreateUserBody / createUserSchema). The only way an account becomes
 * Admin/EIC in this system is by already being one; nothing on this API
 * surface can create or promote to it.
 */
export async function createUser(input: CreateUserBody): Promise<AppUser> {
  const email = input.email.trim().toLowerCase();

  const existing = await prisma.user.findUnique({ where: { email } });
  // ConflictError (not a plain Error) so this specific, safe-to-show message
  // actually reaches the client — the generic catch-all in api/_helpers.ts
  // deliberately hides plain Error messages, which is why this used to
  // surface as an opaque "Something went wrong" instead of telling the admin
  // what was actually wrong.
  if (existing) {
    throw new ConflictError("This email is already registered.");
  }

  const row = await prisma.user.create({
    data: {
      email,
      displayName: input.displayName,
      passwordHash: await bcrypt.hash(input.password, BCRYPT_ROUNDS),
      role: "editor",
      active: true,
    },
  });

  return toAppUser(row);
}

export async function updateUser(
  id: string,
  input: UpdateUserBody
): Promise<AppUser> {
  const row = await prisma.user.update({
    where: { id },
    data: {
      ...(input.displayName !== undefined
        ? { displayName: input.displayName }
        : {}),
      ...(input.role !== undefined ? { role: input.role } : {}),
      ...(input.active !== undefined ? { active: input.active } : {}),
      ...((input.active !== undefined || input.role !== undefined)
        ? { sessionVersion: { increment: 1 } }
        : {}),
      ...(input.avatarUrl !== undefined
        ? { avatarUrl: input.avatarUrl ?? null }
        : {}),
    },
  });
  return toAppUser(row);
}

export async function setUserActive(
  id: string,
  active: boolean
): Promise<AppUser> {
  const row = await prisma.user.update({
    where: { id },
    data: { active, sessionVersion: { increment: 1 } },
  });
  return toAppUser(row);
}

/**
 * Soft-delete: revokes login/access without touching anything the account
 * created. The gentler option next to `deleteUserPermanently` — prefer this
 * when the goal is "this person shouldn't have access anymore" rather than
 * "erase every trace of this account existing".
 */
export async function deactivateUser(id: string): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { active: false, sessionVersion: { increment: 1 } },
  });
}

/**
 * Genuine hard delete — actually removes the row from `users`, not a status
 * flip. Caller MUST gate this with requireAdmin() (see
 * api/users/[id]/route.ts's DELETE handler) and MUST reject self-deletion
 * before calling this — this function has no notion of "who is asking".
 *
 * Restricted to Editor accounts: this is specifically "EIC/Admin deletes an
 * Editor account", the same scope `setApprovalAuthority` already uses for
 * granting/revoking approval authority. Deleting another Admin isn't part
 * of this capability.
 *
 * Articles/media/activity-log rows reference their author/uploader/actor
 * with `onDelete: SetNull` (see the schema comments on Article.authorId,
 * MediaAsset.uploadedById, ActivityLog.actorId) — deliberately NOT Cascade:
 * deleting this account never deletes an article, an uploaded file, or an
 * audit-log entry. Those rows survive completely intact; only their "which
 * account did this" link goes null, which every read path already renders
 * gracefully (toArticle(): "Author information unavailable", toActivityLog():
 * "Unknown"). The try/catch below is a defensive fallback, not the expected
 * path, in case a future relation is ever added as Restrict by mistake.
 */
export async function deleteUserPermanently(id: string): Promise<void> {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true, displayName: true },
  });
  if (!target) throw new Error("Account not found.");
  if (target.role !== "editor") {
    throw new ConflictError("Only Editor accounts can be permanently deleted.");
  }

  try {
    await prisma.user.delete({ where: { id } });
  } catch (err) {
    if (
      err instanceof Prisma.PrismaClientKnownRequestError &&
      err.code === "P2003"
    ) {
      throw new ConflictError(
        `"${target.displayName}" has existing articles, uploads, or activity history and can't be permanently deleted. Deactivate the account instead to revoke access while preserving their published work and audit trail.`
      );
    }
    throw err;
  }
}

/**
 * Self-service profile edit — deliberately narrower than updateUser(), which
 * also accepts role/active. Those stay admin-only via /api/users/[id].
 */
export async function updateOwnProfile(
  id: string,
  input: { displayName?: string; avatarUrl?: string | null }
): Promise<AppUser> {
  const row = await prisma.user.update({
    where: { id },
    data: {
      ...(input.displayName !== undefined ? { displayName: input.displayName } : {}),
      ...(input.avatarUrl !== undefined ? { avatarUrl: input.avatarUrl ?? null } : {}),
    },
  });
  return toAppUser(row);
}

/** Verifies the current password before setting a new one. */
export async function changePassword(
  id: string,
  currentPassword: string,
  newPassword: string
): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { passwordHash: true },
  });
  if (!user) throw new Error("Account not found.");

  const ok = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!ok) throw new Error("Your current password is incorrect.");

  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      sessionVersion: { increment: 1 },
    },
  });
}

/** Admin reset — no current-password check. Guard the caller with requireAdmin. */
export async function updatePassword(
  id: string,
  newPassword: string
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: {
      passwordHash: await bcrypt.hash(newPassword, BCRYPT_ROUNDS),
      sessionVersion: { increment: 1 },
    },
  });
}

/**
 * Grants or revokes delegated article-approval authority. Caller MUST gate
 * this with requireAdmin() — see api/users/[id]/approval-authority/route.ts,
 * which is the only place this is ever called from. Restricted to editor
 * accounts: granting it to an admin is meaningless (admins already have
 * full approval authority intrinsically) and granting it to a reader is
 * nonsensical (readers never sign in), so both are rejected as a sanity
 * check rather than silently no-op'd.
 */
export async function setApprovalAuthority(
  id: string,
  canApproveArticles: boolean
): Promise<AppUser> {
  const target = await prisma.user.findUnique({
    where: { id },
    select: { role: true },
  });
  if (!target) throw new Error("Account not found.");
  if (target.role !== "editor") {
    throw new ConflictError(
      "Approval authority can only be granted to or revoked from an Editor account."
    );
  }

  const row = await prisma.user.update({
    where: { id },
    data: { canApproveArticles },
  });
  return toAppUser(row);
}

/**
 * Which Terms & Conditions version this staff account has acknowledged.
 * Null means "never accepted" — compared against TermsPage.version to gate
 * the dashboard when the Admin/EIC publishes a substantially updated Terms.
 */
export async function getTermsAcceptedVersion(id: string): Promise<number | null> {
  const user = await prisma.user.findUnique({
    where: { id },
    select: { termsAcceptedVersion: true },
  });
  return user?.termsAcceptedVersion ?? null;
}

export async function setTermsAcceptedVersion(
  id: string,
  version: number
): Promise<void> {
  await prisma.user.update({
    where: { id },
    data: { termsAcceptedVersion: version },
  });
}

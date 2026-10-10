/**
 * Central authorization rules.
 *
 * Every API route imports its checks from here. If a rule changes ("editors
 * may edit each other's drafts"), it changes in ONE place instead of thirty.
 *
 * IMPORTANT: hiding a nav item in React is UX, not security. These functions
 * must be called server-side, inside the API route, before any data access.
 *
 * AUTHORITY MODEL
 * ----------------
 * `admin` IS the Editor-in-Chief — the account with unconditional, full
 * system authority (users, Editorial Board, categories, settings,
 * About/Terms, media, and article approval). `editor` is a narrower role:
 * editors create/edit/submit articles, but do NOT get article-approval
 * authority just by being an editor. The EIC delegates that specific
 * capability per-account via `User.canApproveArticles` — see
 * `canApproveArticles()` below. Never check `user.role === "editor"` as a
 * stand-in for approval rights; always go through that function.
 */

import type { AppUser, UserRole } from "@/types/domain";

type SessionUser = Pick<AppUser, "id" | "role" | "active" | "canApproveArticles">;

function isActive(user: SessionUser | null | undefined): user is SessionUser {
  return Boolean(user && user.active);
}

export function hasRole(
  user: SessionUser | null | undefined,
  roles: UserRole[]
): boolean {
  return isActive(user) && roles.includes(user.role);
}

export function isAdmin(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["admin"]);
}

export function isEditorOrAdmin(user: SessionUser | null | undefined): boolean {
  return hasRole(user, ["editor", "admin"]);
}

// ---------- Articles ----------

export function canCreateArticle(user: SessionUser | null | undefined): boolean {
  return isEditorOrAdmin(user);
}

/**
 * Editors may only touch their own articles; admins may touch any.
 * `authorId` can be null (the authoring account was deleted — see
 * Article.authorId's schema comment); an orphaned article then falls to
 * admin-only, since no editor's id can ever equal null.
 */
export function canEditArticle(
  user: SessionUser | null | undefined,
  article: { authorId: string | null }
): boolean {
  if (!isActive(user)) return false;
  if (user.role === "admin") return true;
  return user.role === "editor" && article.authorId !== null && user.id === article.authorId;
}

export function canDeleteArticle(
  user: SessionUser | null | undefined,
  article: { authorId: string | null }
): boolean {
  return canEditArticle(user, article);
}

/**
 * The single source of truth for "may this account approve/reject a
 * pending article" — i.e. move it into "published" or "needs_revision".
 * Admins always can (intrinsic EIC authority). Editors can ONLY if the EIC
 * has explicitly delegated it via `User.canApproveArticles` — being an
 * editor is never sufficient on its own. See permissions.ts's file-top note.
 */
export function canApproveArticles(user: SessionUser | null | undefined): boolean {
  if (!isActive(user)) return false;
  if (user.role === "admin") return true;
  return user.role === "editor" && user.canApproveArticles === true;
}

/**
 * Kept as the name the publish-transition gate already uses in
 * api/articles/[id]/route.ts — delegates to the shared check above, which
 * also gates the reject-to-"needs_revision" transition. Both are review
 * decisions and require the same authority.
 */
export function canPublishArticle(user: SessionUser | null | undefined): boolean {
  return canApproveArticles(user);
}

/** Only the EIC grants/revokes delegated approval authority. */
export function canManageApprovalAuthority(
  user: SessionUser | null | undefined
): boolean {
  return isAdmin(user);
}

// ---------- Everything else ----------

export function canManageCategories(user: SessionUser | null | undefined): boolean {
  return isEditorOrAdmin(user);
}

export function canManageMedia(user: SessionUser | null | undefined): boolean {
  return isEditorOrAdmin(user);
}

export function canDeleteMedia(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canManageBoard(user: SessionUser | null | undefined): boolean {
  return isEditorOrAdmin(user);
}

export function canReadFeedback(user: SessionUser | null | undefined): boolean {
  return isEditorOrAdmin(user);
}

export function canManageUsers(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canViewAnalytics(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canViewActivityLogs(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

export function canEditSettings(user: SessionUser | null | undefined): boolean {
  return isAdmin(user);
}

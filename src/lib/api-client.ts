/**
 * Browser-side API client.
 *
 * Client Components call these instead of talking to the database directly.
 * This is the seam that replaced the prototype's Firebase SDK calls: the UI no
 * longer holds database credentials or knows what the storage engine is.
 *
 * Server Components should skip this and call the repositories in
 * `src/server/repositories/` directly — no HTTP round-trip needed.
 */

import type {
  AboutPage,
  Article,
  BoardMember,
  Category,
  Feedback,
  MediaAsset,
  Position,
  TermsPage,
  WebsiteSettings,
} from "@/types/domain";
import type {
  CreateArticleBody,
  CreateBoardMemberBody,
  CreateCategoryBody,
  CreateFeedbackBody,
  CreatePositionBody,
  CreateUserBody,
  Paginated,
  UpdateArticleBody,
  UpdateAboutPageBody,
  UpdateBoardMemberBody,
  UpdateCategoryBody,
  UpdateOwnProfileBody,
  UpdatePositionBody,
  UpdateTermsPageBody,
  UpdateUserBody,
} from "@/types/api";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
      // On a Zod validation failure, _helpers.ts's badRequest() sends
      // `error: "Invalid input"` PLUS a `details` map of the actual
      // per-field reasons (e.g. { password: ["Must include a number."] }) —
      // that detail was already there; this just stops discarding it. This
      // is the fix for every dashboard form that only ever showed the
      // generic "Invalid input" no matter what was actually wrong.
      if (body?.details && typeof body.details === "object") {
        const reasons = Object.values(body.details as Record<string, string[]>).flat();
        if (reasons.length > 0) message = reasons.join(" ");
      }
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

// ---------- articles ----------

export function fetchArticles(params: Record<string, string> = {}) {
  const qs = new URLSearchParams(params).toString();
  return request<Paginated<Article>>(`/api/articles${qs ? `?${qs}` : ""}`);
}

export function fetchArticle(idOrSlug: string) {
  return request<Article>(`/api/articles/${idOrSlug}`);
}

export function createArticle(body: CreateArticleBody) {
  return request<Article>("/api/articles", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateArticle(id: string, body: UpdateArticleBody) {
  return request<Article>(`/api/articles/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteArticle(id: string) {
  return request<void>(`/api/articles/${id}`, { method: "DELETE" });
}

// ---------- engagement (anonymous readers) ----------

export function toggleLike(articleId: string, active: boolean) {
  return request<{ likes: number }>(`/api/articles/${articleId}/like`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export function toggleBookmark(articleId: string, active: boolean) {
  return request<{ bookmarks: number }>(`/api/articles/${articleId}/bookmark`, {
    method: "POST",
    body: JSON.stringify({ active }),
  });
}

export function recordView(articleId: string) {
  return request<void>(`/api/articles/${articleId}/view`, { method: "POST" });
}

// ---------- categories ----------

export function fetchCategories() {
  return request<Category[]>("/api/categories");
}

export function createCategory(body: CreateCategoryBody) {
  return request<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateCategory(id: string, body: UpdateCategoryBody) {
  return request<Category>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteCategory(id: string) {
  return request<void>(`/api/categories/${id}`, { method: "DELETE" });
}

// ---------- users ----------

export function fetchUsers() {
  return request<import("@/types/domain").AppUser[]>("/api/users");
}

export function createUser(body: CreateUserBody) {
  return request<import("@/types/domain").AppUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateUser(id: string, body: UpdateUserBody) {
  return request(`/api/users/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

/**
 * Permanently deletes an Editor account — distinct from `updateUser(id,
 * { active: false })`, which deactivates without removing the row. Fails
 * with a clear message if the account has articles/uploads/activity history
 * (see deleteUserPermanently in the repository for why).
 */
export function deleteUserAccount(id: string) {
  return request<void>(`/api/users/${id}`, { method: "DELETE" });
}

/** Admin-only: grant or revoke a delegated Editor's article-approval authority. */
export function updateApprovalAuthority(id: string, canApproveArticles: boolean) {
  return request<import("@/types/domain").AppUser>(
    `/api/users/${id}/approval-authority`,
    {
      method: "PATCH",
      body: JSON.stringify({ canApproveArticles }),
    }
  );
}

export function updateOwnProfile(body: UpdateOwnProfileBody) {
  return request<import("@/types/domain").AppUser>("/api/users/me", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ---------- feedback ----------

/** Public — any reader may submit. */
export function submitFeedback(message: string, name?: string) {
  const body: CreateFeedbackBody = { message, name };
  return request<void>("/api/feedback", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function fetchFeedback() {
  return request<Feedback[]>("/api/feedback");
}

export function updateFeedbackStatus(id: string, status: Feedback["status"]) {
  return request<Feedback>(`/api/feedback/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  });
}

export function deleteFeedbackItem(id: string) {
  return request<void>(`/api/feedback/${id}`, { method: "DELETE" });
}

// ---------- board ----------

export function fetchBoardMembers() {
  return request<BoardMember[]>("/api/board-members");
}

export function createBoardMember(body: CreateBoardMemberBody) {
  return request<BoardMember>("/api/board-members", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updateBoardMember(id: string, body: UpdateBoardMemberBody) {
  return request<BoardMember>(`/api/board-members/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deleteBoardMember(id: string) {
  return request<void>(`/api/board-members/${id}`, { method: "DELETE" });
}

// ---------- positions ----------

export function fetchPositions() {
  return request<Position[]>("/api/positions");
}

export function createPosition(body: CreatePositionBody) {
  return request<Position>("/api/positions", {
    method: "POST",
    body: JSON.stringify(body),
  });
}

export function updatePosition(id: string, body: UpdatePositionBody) {
  return request<Position>(`/api/positions/${id}`, {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function deletePosition(id: string) {
  return request<void>(`/api/positions/${id}`, { method: "DELETE" });
}

// ---------- media ----------

export function fetchMedia() {
  return request<MediaAsset[]>("/api/media");
}

/** Multipart upload — deliberately bypasses the JSON helper. */
export async function uploadMedia(file: File): Promise<MediaAsset> {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/api/media", { method: "POST", body: form });
  if (!res.ok) throw new Error("Upload failed.");
  return (await res.json()) as MediaAsset;
}

export function deleteMediaAsset(id: string) {
  return request<void>(`/api/media/${id}`, { method: "DELETE" });
}

// ---------- settings ----------

export function fetchSettings() {
  return request<WebsiteSettings>("/api/settings");
}

export function updateSettings(body: Partial<WebsiteSettings>) {
  return request<WebsiteSettings>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ---------- about page ----------

export function fetchAboutPage() {
  return request<AboutPage>("/api/about");
}

export function updateAboutPage(body: UpdateAboutPageBody) {
  return request<AboutPage>("/api/about", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

// ---------- terms page ----------

export function fetchTermsPage() {
  return request<TermsPage>("/api/terms");
}

export function updateTermsPage(body: UpdateTermsPageBody) {
  return request<TermsPage>("/api/terms", {
    method: "PATCH",
    body: JSON.stringify(body),
  });
}

export function acceptTerms() {
  return request<{ accepted: boolean; version: number }>("/api/terms/accept", {
    method: "POST",
  });
}

// ---------- search ----------

export function search(params: Record<string, string>) {
  const qs = new URLSearchParams(params).toString();
  return request<Paginated<Article>>(`/api/search?${qs}`);
}

// ---------- analytics ----------

export function recordVisit() {
  return request<void>("/api/analytics/visit", { method: "POST" });
}

/** Admin-only. Pass either `{ preset }` or `{ from, to }` (YYYY-MM-DD), not both. */
export function fetchAnalytics(params: { preset?: string; from?: string; to?: string }) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined) as [string, string][]
  ).toString();
  return request<import("@/server/repositories/analytics").AnalyticsPayload>(
    `/api/analytics${qs ? `?${qs}` : ""}`
  );
}

// ---------- password reset ----------

export function requestPasswordReset(email: string) {
  return request<{ message: string }>("/api/auth/forgot-password", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function resetPassword(token: string, newPassword: string) {
  return request<{ message: string }>("/api/auth/reset-password", {
    method: "POST",
    body: JSON.stringify({ token, newPassword }),
  });
}

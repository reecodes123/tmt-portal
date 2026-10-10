/**
 * Input validation schemas.
 *
 * Every API route parses its request body through one of these BEFORE touching
 * the database. This is the boundary where malformed and malicious input gets
 * rejected — the prototype had no server-side validation at all because
 * Firestore rules only checked shape, not content.
 */

import { z } from "zod";
import { ICON_KEYS } from "./icons";

// ---------- primitives ----------

export const idSchema = z.string().min(1).max(60);
export const slugSchema = z
  .string()
  .min(1)
  .max(220)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Must be a lowercase, hyphenated slug.");

/**
 * Accepts either an absolute URL (Vercel Blob storage in production) or a
 * site-relative path beginning with "/" (local-disk storage in dev — see
 * server/storage.ts's `storeFile()` — and static assets like
 * "/images/logo.png"). Plain `z.string().url()` rejects the latter, which is
 * exactly what local uploads and several seeded defaults produce — this was
 * the actual cause of Settings failing to save with "Invalid input".
 */
const mediaUrlSchema = z
  .string()
  .max(500)
  .refine((v) => v.startsWith("/") || /^https?:\/\//.test(v), {
    message: 'Must be a URL or a site-relative path starting with "/".',
  });

export const roleSchema = z.enum(["reader", "editor", "admin"]);
export const articleStatusSchema = z.enum([
  "draft",
  "in_review",
  "needs_revision",
  "published",
]);
export const feedbackStatusSchema = z.enum(["unread", "read", "archived"]);
export const boardTierSchema = z.enum([
  "adviser",
  "editor-in-chief",
  "editorial-leadership",
  "section-editor",
  "assistant-editor",
  "news-writer",
  "feature-writer",
  "sports-writer",
  "literary-writer",
  "copyreader",
  "cartoonist",
  "photojournalist",
  "creatives",
  "media",
  "broadcast",
  "technical",
  "consultant",
]);

/**
 * Passwords: minimum 10 characters with mixed character classes. Longer and
 * simpler beats short and cryptic — length is what actually resists guessing.
 */
export const passwordSchema = z
  .string()
  .min(10, "Password must be at least 10 characters.")
  .max(200)
  .regex(/[a-z]/, "Must include a lowercase letter.")
  .regex(/[A-Z]/, "Must include an uppercase letter.")
  .regex(/[0-9]/, "Must include a number.");

// ---------- articles ----------

export const createArticleSchema = z.object({
  title: z.string().min(3).max(255),
  subheadline: z.string().max(255).optional(),
  /**
   * Legacy field — no longer collected by the article form (see
   * ArticleEditorForm.tsx). Was `z.string().min(10).max(600)` with no
   * `.optional()`, which is exactly why omitting it produced "Invalid
   * input": create/update always sent an empty string, and an empty string
   * fails `.min(10)`. Kept nullable/optional rather than removed so an
   * article that already has a value keeps working when edited.
   */
  excerpt: z.string().max(600).nullable().optional(),
  content: z.string().min(1),
  categorySlug: slugSchema,
  coverImageUrl: mediaUrlSchema,
  photoCredit: z.string().max(160).nullable().optional(),
  /**
   * Manually typed byline — "Airelyn Moreno", "Juan Dela Cruz and Maria
   * Santos", etc. Deliberately plain text with no cross-check against the
   * `User` or `Position` tables: the writer credited here often isn't the
   * dashboard account publishing the article, and doesn't need to hold any
   * Editorial Board title.
   */
  articleBy: z
    .string()
    .trim()
    .min(1, "Please enter who wrote this article.")
    .max(160),
  contentImageUrls: z.array(mediaUrlSchema).max(30).optional(),
  featured: z.boolean().optional(),
  status: articleStatusSchema,
  publishedAt: z.string().datetime().nullable().optional(),
});

export const updateArticleSchema = createArticleSchema.partial();

export const articleListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
  category: slugSchema.optional(),
  status: articleStatusSchema.optional(),
  authorId: idSchema.optional(),
  q: z.string().max(200).optional(),
  featured: z.coerce.boolean().optional(),
});

// ---------- categories ----------

export const createCategorySchema = z.object({
  name: z.string().min(2).max(80),
  description: z.string().max(1000).optional(),
});

export const updateCategorySchema = createCategorySchema.partial();

// ---------- users ----------

/**
 * Deliberately has no `role` field. The publication only ever needs Admin/EIC
 * accounts that already exist plus Editor accounts created from here — so
 * this endpoint always creates an Editor (see repositories/users.ts's
 * createUser()), and there's no field for a request body to smuggle a
 * different role through even in principle. If a raw request includes a
 * `role` key anyway, Zod's default (non-strict) parsing silently drops it —
 * it's not part of this schema's shape, so it never reaches the repository.
 */
export const createUserSchema = z.object({
  email: z.string().email().max(255),
  displayName: z.string().min(2).max(120),
  password: passwordSchema,
});

export const updateUserSchema = z.object({
  displayName: z.string().min(2).max(120).optional(),
  role: roleSchema.optional(),
  active: z.boolean().optional(),
  avatarUrl: z.string().url().max(500).nullable().optional(),
});

/**
 * Grants/revokes delegated article-approval authority. Deliberately its own
 * schema for its own admin-only endpoint (see
 * api/users/[id]/approval-authority/route.ts) rather than folding this into
 * `updateUserSchema` — keeping it off the general profile-update surface
 * means there's no field an editor's own self-service request could ever
 * carry to grant themselves this capability, even in principle.
 */
export const updateApprovalAuthoritySchema = z.object({
  canApproveArticles: z.boolean(),
});

export const updateOwnProfileSchema = z
  .object({
    displayName: z.string().min(2).max(120).optional(),
    avatarUrl: z.string().url().max(500).nullable().optional(),
    currentPassword: z.string().optional(),
    newPassword: passwordSchema.optional(),
  })
  .refine((v) => !v.newPassword || Boolean(v.currentPassword), {
    message: "Current password is required to set a new one.",
    path: ["currentPassword"],
  });

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1, "Password is required."),
});

// ---------- password reset ----------

export const forgotPasswordSchema = z.object({
  email: z.string().email().max(255),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20).max(200),
  newPassword: passwordSchema,
});

// ---------- feedback ----------

export const createFeedbackSchema = z.object({
  message: z.string().min(5, "Please write a little more.").max(2000),
  name: z.string().max(120).optional(),
});

export const updateFeedbackSchema = z.object({
  status: feedbackStatusSchema,
});

// ---------- positions ----------

/**
 * Trimmed + non-empty. Uniqueness (including preventing "Managing Editor" vs
 * "managing editor" duplicates) is enforced at the DB level too — the
 * `positions.name` column uses the schema-wide utf8mb4_unicode_ci collation,
 * which compares case-insensitively.
 */
export const createPositionSchema = z.object({
  name: z.string().trim().min(2).max(120),
  tier: boardTierSchema,
  sortOrder: z.number().int().min(0).max(999).optional(),
});

export const updatePositionSchema = createPositionSchema.partial();

// ---------- board ----------

export const createBoardMemberSchema = z.object({
  name: z.string().min(2).max(120),
  positionId: idSchema,
  description: z.string().max(1000).optional(),
  // Nullable (not just optional) so a PATCH can explicitly clear a photo —
  // mirrors the same escape hatch already used for WebsiteSettings.logoUrl.
  imageUrl: mediaUrlSchema.nullable().optional(),
  sortOrder: z.number().int().min(0).max(999).optional(),
  userId: idSchema.nullable().optional(),
});

export const updateBoardMemberSchema = createBoardMemberSchema.partial();

// ---------- settings ----------

export const updateSettingsSchema = z.object({
  siteName: z.string().min(2).max(120).optional(),
  tagline: z.string().max(255).optional(),
  logoUrl: mediaUrlSchema.nullable().optional(),
  heroHeadline: z.string().max(255).optional(),
  heroSubheadline: z.string().max(1000).optional(),
  announcement: z.string().max(1000).nullable().optional(),
  organizationName: z.string().max(120).optional(),
  organizationDescription: z.string().max(2000).optional(),
  contactEmail: z.string().email().max(255).optional(),
  socialFacebook: z.string().url().max(500).or(z.literal("")).optional(),
  socialX: z.string().url().max(500).or(z.literal("")).optional(),
  socialInstagram: z.string().url().max(500).or(z.literal("")).optional(),
  socialYoutube: z.string().url().max(500).or(z.literal("")).optional(),
  footerText: z.string().max(2000).optional(),
  academicYear: z.string().min(4).max(20).optional(),
});

// ---------- about page ----------

const iconKeySchema = z.enum(ICON_KEYS);

export const missionPillarSchema = z.object({
  icon: iconKeySchema,
  label: z.string().min(1).max(60),
  description: z.string().min(1).max(240),
});

export const achievementSchema = z.object({
  year: z.string().min(4).max(9),
  icon: iconKeySchema,
  title: z.string().min(1).max(160),
  description: z.string().min(1).max(400),
});

export const updateAboutPageSchema = z.object({
  heroEyebrow: z.string().max(120).nullable().optional(),
  heroTitle: z.string().min(2).max(120).optional(),
  heroSubtitle: z.string().max(2000).nullable().optional(),
  heroImageUrl: mediaUrlSchema.nullable().optional(),
  overview: z.string().min(1).optional(),
  missionPillars: z.array(missionPillarSchema).max(6).optional(),
  achievements: z.array(achievementSchema).max(50).optional(),
});

// ---------- terms page ----------

export const updateTermsPageSchema = z.object({
  content: z.string().min(1).optional(),
  bumpVersion: z.boolean().optional(),
});

// ---------- engagement ----------

export const engagementSchema = z.object({
  active: z.boolean(),
});

// ---------- search ----------

export const searchQuerySchema = z.object({
  q: z.string().min(1).max(200),
  category: slugSchema.optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(60).default(12),
});

// ---------- analytics ----------

export const analyticsRangeQuerySchema = z.object({
  preset: z.enum(["3d", "7d", "1m", "2m", "3m", "6m", "1y", "all"]).optional(),
  /** Plain YYYY-MM-DD, not full datetime — a custom range picker sends dates,
   * not timestamps. Only used when `preset` is omitted. */
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD.")
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be YYYY-MM-DD.")
    .optional(),
});

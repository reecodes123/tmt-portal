/**
 * Prisma row → domain object mappers.
 *
 * The database and the domain deliberately disagree in three places, and this
 * is the single file where those differences are reconciled:
 *
 *   1. DATES. Prisma returns `Date`; the domain uses ISO strings so objects
 *      can cross the server/client boundary without serialisation surprises.
 *   2. TIERS. Prisma enums can't contain hyphens, so the DB stores
 *      `editor_in_chief` while URLs and UI use `editor-in-chief`.
 *   3. RELATIONS. The DB stores `categoryId` / `authorId`; the domain wants
 *      the human-facing `categorySlug`, `categoryName`, `authorName`.
 *
 * Keeping this in one place means a schema change breaks compilation here
 * rather than silently producing wrong data three layers up.
 */

import type {
  Achievement,
  ActivityLog,
  AppUser,
  Article,
  BoardMember,
  BoardTier,
  Category,
  Feedback,
  MediaAsset,
  MissionPillar,
  AboutPage,
  Position as DomainPosition,
  TermsPage,
  WebsiteSettings,
} from "@/types/domain";

/** Prisma `Date` → ISO string. */
export function iso(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/** Same, but for columns that are NOT NULL. */
export function isoRequired(value: Date): string {
  return value.toISOString();
}

/** DB enum (`editor_in_chief`) → domain tier (`editor-in-chief`). */
export function toDomainTier(tier: string): BoardTier {
  return tier.replace(/_/g, "-") as BoardTier;
}

/** Domain tier (`editor-in-chief`) → DB enum (`editor_in_chief`). */
export function toDbTier(tier: string): string {
  return tier.replace(/-/g, "_");
}

/**
 * `contentImageUrls` is a JSON column, which Prisma types as `JsonValue`.
 * Narrow it back to the string[] the domain expects, defensively — a
 * hand-edited row shouldn't crash a page render.
 */
export function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((v): v is string => typeof v === "string");
}

// ---------------------------------------------------------------- shapes
// Minimal structural types describing what each mapper needs. Using these
// instead of Prisma's generated model types keeps the mappers usable with
// partial selects and avoids a hard dependency on generated names.

interface ArticleRow {
  id: string;
  slug: string;
  title: string;
  subheadline: string | null;
  excerpt: string | null;
  /**
   * Omitted (along with `contentImageUrls`) by list queries — see
   * repositories/articles.ts's LIST_SELECT — since no list view renders
   * either and both can be a genuinely large payload per row. toArticle()
   * below fills in a safe empty default when absent. Every *single-article*
   * read (getArticleBySlug, getArticleById, create/update) still selects
   * this via WITH_RELATIONS, so detail pages and the editor always get the
   * real value — only a list-sourced Article should ever see the fallback.
   */
  content?: string;
  coverImageUrl: string;
  photoCredit: string | null;
  articleBy: string;
  contentImageUrls?: unknown;
  featured: boolean;
  status: string;
  publishedAt: Date | null;
  views: number;
  likes: number;
  bookmarks: number;
  createdAt: Date;
  updatedAt: Date;
  categoryId: string;
  authorId: string | null;
  category?: { slug: string; name: string } | null;
  author?: { displayName: string } | null;
}

export function toArticle(row: ArticleRow): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    subheadline: row.subheadline,
    excerpt: row.excerpt,
    // See ArticleRow's comment on `content` above — "" only ever shows up on
    // a list-sourced Article, which no list UI reads this field from anyway.
    content: row.content ?? "",
    categorySlug: row.category?.slug ?? "",
    categoryName: row.category?.name ?? "",
    authorId: row.authorId,
    authorName: row.author?.displayName ?? "Author information unavailable",
    coverImageUrl: row.coverImageUrl,
    photoCredit: row.photoCredit,
    articleBy: row.articleBy,
    contentImageUrls: toStringArray(row.contentImageUrls),
    featured: row.featured,
    status: row.status as Article["status"],
    publishedAt: iso(row.publishedAt),
    views: row.views,
    likes: row.likes,
    bookmarks: row.bookmarks,
    createdAt: isoRequired(row.createdAt),
    updatedAt: isoRequired(row.updatedAt),
  };
}

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  _count?: { articles: number };
}

export function toCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    articleCount: row._count?.articles,
  };
}

interface UserRow {
  id: string;
  email: string;
  displayName: string;
  role: string;
  active: boolean;
  avatarUrl: string | null;
  canApproveArticles: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export function toAppUser(row: UserRow): AppUser {
  return {
    id: row.id,
    email: row.email,
    displayName: row.displayName,
    role: row.role as AppUser["role"],
    active: row.active,
    avatarUrl: row.avatarUrl,
    canApproveArticles: row.canApproveArticles,
    createdAt: isoRequired(row.createdAt),
    updatedAt: isoRequired(row.updatedAt),
  };
}

interface PositionRow {
  id: string;
  name: string;
  tier: string;
  sortOrder: number;
}

export function toPosition(row: PositionRow): DomainPosition {
  return {
    id: row.id,
    name: row.name,
    tier: toDomainTier(row.tier),
    sortOrder: row.sortOrder,
  };
}

interface BoardMemberRow {
  id: string;
  name: string;
  positionId: string;
  description: string | null;
  imageUrl: string | null;
  sortOrder: number;
  userId: string | null;
  position: { name: string; tier: string };
}

export function toBoardMember(row: BoardMemberRow): BoardMember {
  return {
    id: row.id,
    name: row.name,
    positionId: row.positionId,
    positionName: row.position.name,
    positionTier: toDomainTier(row.position.tier),
    description: row.description,
    imageUrl: row.imageUrl,
    sortOrder: row.sortOrder,
    userId: row.userId,
  };
}

interface MediaRow {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string | null;
  createdAt: Date;
  uploadedBy?: { displayName: string } | null;
}

export function toMediaAsset(row: MediaRow): MediaAsset {
  return {
    id: row.id,
    url: row.url,
    fileName: row.fileName,
    mimeType: row.mimeType,
    sizeBytes: row.sizeBytes,
    uploadedById: row.uploadedById,
    uploadedByName: row.uploadedBy?.displayName,
    createdAt: isoRequired(row.createdAt),
  };
}

interface FeedbackRow {
  id: string;
  message: string;
  name: string | null;
  status: string;
  submittedAt: Date;
}

export function toFeedback(row: FeedbackRow): Feedback {
  return {
    id: row.id,
    message: row.message,
    name: row.name,
    status: row.status as Feedback["status"],
    submittedAt: isoRequired(row.submittedAt),
  };
}

interface SettingsRow {
  siteName: string;
  tagline: string;
  logoUrl: string | null;
  heroHeadline: string;
  heroSubheadline: string;
  announcement: string | null;
  organizationName: string;
  organizationDescription: string;
  contactEmail: string;
  socialFacebook: string;
  socialX: string;
  socialInstagram: string;
  socialYoutube: string;
  footerText: string;
  academicYear: string;
}

export function toSettings(row: SettingsRow): WebsiteSettings {
  return {
    siteName: row.siteName,
    tagline: row.tagline,
    logoUrl: row.logoUrl,
    heroHeadline: row.heroHeadline,
    heroSubheadline: row.heroSubheadline,
    announcement: row.announcement,
    organizationName: row.organizationName,
    organizationDescription: row.organizationDescription,
    contactEmail: row.contactEmail,
    socialFacebook: row.socialFacebook,
    socialX: row.socialX,
    socialInstagram: row.socialInstagram,
    socialYoutube: row.socialYoutube,
    footerText: row.footerText,
    academicYear: row.academicYear,
  };
}

/**
 * `missionPillars`/`achievements` are JSON columns, typed as `JsonValue`.
 * Narrow them back defensively — a hand-edited row shouldn't crash a render.
 */
function toMissionPillars(value: unknown): MissionPillar[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is MissionPillar =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as MissionPillar).icon === "string" &&
      typeof (v as MissionPillar).label === "string" &&
      typeof (v as MissionPillar).description === "string"
  );
}

function toAchievements(value: unknown): Achievement[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (v): v is Achievement =>
      typeof v === "object" &&
      v !== null &&
      typeof (v as Achievement).year === "string" &&
      typeof (v as Achievement).icon === "string" &&
      typeof (v as Achievement).title === "string" &&
      typeof (v as Achievement).description === "string"
  );
}

interface AboutPageRow {
  heroEyebrow: string | null;
  heroTitle: string;
  heroSubtitle: string | null;
  heroImageUrl: string | null;
  overview: string;
  missionPillars: unknown;
  achievements: unknown;
  updatedAt: Date;
}

export function toAboutPage(row: AboutPageRow): AboutPage {
  return {
    heroEyebrow: row.heroEyebrow,
    heroTitle: row.heroTitle,
    heroSubtitle: row.heroSubtitle,
    heroImageUrl: row.heroImageUrl,
    overview: row.overview,
    missionPillars: toMissionPillars(row.missionPillars),
    achievements: toAchievements(row.achievements),
    updatedAt: isoRequired(row.updatedAt),
  };
}

interface TermsPageRow {
  content: string;
  version: number;
  updatedAt: Date;
}

export function toTermsPage(row: TermsPageRow): TermsPage {
  return {
    content: row.content,
    version: row.version,
    updatedAt: isoRequired(row.updatedAt),
  };
}

interface ActivityLogRow {
  id: string;
  action: string;
  targetType: string;
  targetId: string | null;
  summary: string;
  createdAt: Date;
  actorId: string | null;
  actor?: { displayName: string } | null;
}

export function toActivityLog(row: ActivityLogRow): ActivityLog {
  return {
    id: row.id,
    actorId: row.actorId,
    actorName: row.actor?.displayName ?? "Unknown",
    action: row.action as ActivityLog["action"],
    targetType: row.targetType,
    targetId: row.targetId,
    summary: row.summary,
    createdAt: isoRequired(row.createdAt),
  };
}

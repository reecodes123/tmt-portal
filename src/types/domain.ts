/**
 * Domain types — the single source of truth for the shapes used across the app.
 *
 * NAMING DECISIONS (see docs/ARCHITECTURE.md §Naming):
 *  - Roles are `reader | editor | admin`. "Chief Editor" / "Senior Editor" are
 *    *editorial titles* shown on the Editorial Board, not login roles.
 *  - `admin` IS the Editor-in-Chief role — the account with full system
 *    authority (users, settings, Editorial Board, About/Terms, media,
 *    approving articles). It is never treated as interchangeable with
 *    `editor`; see server/permissions.ts for the full authority model.
 *  - Article status is `draft | in_review | needs_revision | published` —
 *    the review step exists so an authorized reviewer approves before
 *    anything goes live, with a revision loop if it's rejected instead.
 *  - "Category" is the only term. The prototypes' "Sections" were the same thing.
 */

export type UserRole = "reader" | "editor" | "admin";

/** Roles that can sign in to the dashboard. Readers never authenticate. */
export const DASHBOARD_ROLES: UserRole[] = ["editor", "admin"];

export interface AppUser {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  active: boolean;
  avatarUrl?: string | null;
  /**
   * Delegated article-approval authority, grantable only by an admin
   * (Editor-in-Chief) — see server/permissions.ts's `canApproveArticles()`.
   * Only meaningful when role is "editor"; admins always have full approval
   * authority intrinsically and never need this set.
   */
  canApproveArticles: boolean;
  createdAt: string;
  updatedAt: string;
}

export type ArticleStatus = "draft" | "in_review" | "needs_revision" | "published";

export const ARTICLE_STATUS_LABELS: Record<ArticleStatus, string> = {
  draft: "Draft",
  in_review: "In Review",
  needs_revision: "Needs Revision",
  published: "Published",
};

export interface Article {
  id: string;
  /** URL-safe unique identifier used for public routes: /articles/[slug] */
  slug: string;
  title: string;
  subheadline?: string | null;
  /** Legacy field — no longer collected on create/edit. Null on every new article. */
  excerpt: string | null;
  /** Rich text stored as HTML. */
  content: string;
  categorySlug: string;
  categoryName?: string;
  /** The dashboard account that authored this — null if that account has
   * since been deleted (the article itself is unaffected; see authorName). */
  authorId: string | null;
  authorName: string;
  coverImageUrl: string;
  /** Photo attribution, e.g. "Juan Dela Cruz". Null when not credited. */
  photoCredit?: string | null;
  /**
   * The credited writer's byline, manually typed by the Editor/EIC — e.g.
   * "Airelyn Moreno" or "Juan Dela Cruz and Maria Santos". Independent of
   * `authorId`/`authorName` (the dashboard account that keyed the article
   * in, kept for auditing) and of the Editorial Board Position system — the
   * person who wrote a piece often isn't the staff account that published
   * it, and needn't hold any Editorial Board title at all.
   */
  articleBy: string;
  contentImageUrls: string[];
  featured: boolean;
  status: ArticleStatus;
  /** When the article went (or is scheduled to go) live. Null while drafting. */
  publishedAt: string | null;
  views: number;
  likes: number;
  bookmarks: number;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  articleCount?: number;
}

export type FeedbackStatus = "unread" | "read" | "archived";

export interface Feedback {
  id: string;
  message: string;
  name?: string | null;
  status: FeedbackStatus;
  submittedAt: string;
}

/**
 * The level a Position sits at — what actually drives grouping/order on the
 * org chart. A person's tier is derived from their Position, never set
 * directly, so tier and title can never disagree with each other.
 */
export type BoardTier =
  | "adviser"
  | "editor-in-chief"
  | "editorial-leadership"
  | "section-editor"
  | "assistant-editor"
  | "news-writer"
  | "feature-writer"
  | "sports-writer"
  | "literary-writer"
  | "copyreader"
  | "cartoonist"
  | "photojournalist"
  | "creatives"
  | "media"
  | "broadcast"
  | "technical"
  | "consultant";

export const TIER_ORDER: BoardTier[] = [
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
];

export const TIER_LABELS: Record<BoardTier, string> = {
  adviser: "Newsletter Adviser",
  "editor-in-chief": "Editor-in-Chief",
  "editorial-leadership": "Editorial Leadership",
  "section-editor": "Section Editors",
  "assistant-editor": "Assistant Editors",
  "news-writer": "News Writers",
  "feature-writer": "Feature Writers",
  "sports-writer": "Sports Writers",
  "literary-writer": "Literary Writers",
  copyreader: "Copyreaders",
  cartoonist: "Cartoonists",
  photojournalist: "Photojournalists",
  creatives: "Creatives",
  media: "Media Editors",
  broadcast: "Broadcasters",
  technical: "Technical Consultants",
  consultant: "Publication Consultant",
};

/**
 * URL-fragment ids for the public Editorial Board page, so the site menu can
 * deep-link to a specific staff section (e.g. /editor-in-chief#news-writer).
 * The tier slug is already URL-safe, so it doubles as the anchor id.
 */
export function tierAnchorId(tier: BoardTier): string {
  return `tier-${tier}`;
}

/**
 * An editorial title — e.g. "Managing Editor", "Lead Photojournalist".
 * Admin-manageable (Dashboard → Positions) so titles can't drift into
 * inconsistent variants the way free-text entry used to allow. `tier`
 * decides where it groups on the org chart.
 */
export interface Position {
  id: string;
  name: string;
  tier: BoardTier;
  sortOrder: number;
}

/**
 * A member of the publication's org chart. Deliberately separate from AppUser:
 * most board members (writers, cartoonists) never need dashboard logins, and
 * some dashboard accounts aren't public-facing board members.
 */
export interface BoardMember {
  id: string;
  name: string;
  positionId: string;
  /** Denormalized from the linked Position, same pattern as Article's categoryName/categorySlug. */
  positionName: string;
  positionTier: BoardTier;
  description?: string | null;
  imageUrl?: string | null;
  sortOrder: number;
  /** Optional link to a login account, when the member also has one. */
  userId?: string | null;
}

export interface MediaAsset {
  id: string;
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  /** Null if the uploading account has since been deleted; the file survives. */
  uploadedById: string | null;
  uploadedByName?: string;
  createdAt: string;
}

export interface WebsiteSettings {
  siteName: string;
  tagline: string;
  logoUrl?: string | null;
  heroHeadline: string;
  heroSubheadline: string;
  announcement?: string | null;
  organizationName: string;
  organizationDescription: string;
  contactEmail: string;
  socialFacebook: string;
  socialX: string;
  socialInstagram: string;
  socialYoutube: string;
  footerText: string;
  /** e.g. "2025–2026". Shown on the Editorial Board page and anywhere else the masthead year is referenced. */
  academicYear: string;
}

export interface MissionPillar {
  icon: string;
  label: string;
  description: string;
}

export interface Achievement {
  year: string;
  icon: string;
  title: string;
  description: string;
}

/** Single-row (id="main") admin-editable content behind the About Us page. */
export interface AboutPage {
  heroEyebrow?: string | null;
  heroTitle: string;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  /** Rich text stored as HTML. */
  overview: string;
  missionPillars: MissionPillar[];
  achievements: Achievement[];
  updatedAt: string;
}

/** Single-row (id="main") admin-editable Terms & Conditions document. */
export interface TermsPage {
  /** Rich text stored as HTML. */
  content: string;
  /** Bumped only when an edit is marked "substantial" — drives re-acceptance. */
  version: number;
  updatedAt: string;
}

export interface DailyVisitStat {
  /** YYYY-MM-DD */
  date: string;
  visitors: number;
}

export type ActivityAction =
  | "article.create"
  | "article.update"
  | "article.publish"
  | "article.delete"
  | "user.create"
  | "user.update"
  | "user.deactivate"
  | "user.delete"
  | "category.create"
  | "category.update"
  | "category.delete"
  | "media.upload"
  | "media.delete"
  | "settings.update"
  | "board.create"
  | "board.update"
  | "board.delete"
  | "position.create"
  | "position.update"
  | "position.delete"
  | "feedback.update"
  | "feedback.delete"
  | "about.update"
  | "terms.update";

/**
 * Audit trail entry. Required by the project proposal ("a detailed version
 * history and audit trail of all modifications must be maintained") and
 * missing from both prototypes.
 */
export interface ActivityLog {
  id: string;
  /** Null if the acting account has since been deleted; the log entry survives. */
  actorId: string | null;
  actorName: string;
  action: ActivityAction;
  targetType: string;
  targetId: string | null;
  summary: string;
  createdAt: string;
}

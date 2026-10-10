/**
 * API data-transfer objects — the contract between client and server.
 *
 * These are kept separate from `domain.ts` on purpose: domain types describe
 * what a thing *is*, DTOs describe what crosses the network. They often match
 * today but will diverge (e.g. paginated envelopes, partial payloads).
 */

import type {
  Achievement,
  Article,
  ArticleStatus,
  BoardTier,
  FeedbackStatus,
  MissionPillar,
  UserRole,
} from "./domain";

/** Standard envelope for list endpoints. */
export interface Paginated<T> {
  items: T[];
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

/** Standard error body returned by every API route on failure. */
export interface ApiError {
  error: string;
  details?: Record<string, string[]>;
}

// ---------- Articles ----------

export interface ArticleListQuery {
  page?: number;
  pageSize?: number;
  category?: string;
  status?: ArticleStatus;
  authorId?: string;
  q?: string;
  featured?: boolean;
}

export interface CreateArticleBody {
  title: string;
  subheadline?: string;
  /** Legacy field — no longer collected by the article form. */
  excerpt?: string | null;
  content: string;
  categorySlug: string;
  coverImageUrl: string;
  photoCredit?: string | null;
  /** Manually entered byline — see Article.articleBy in domain.ts. */
  articleBy: string;
  contentImageUrls?: string[];
  featured?: boolean;
  status: ArticleStatus;
  /** ISO date. When set with status=published, the article is scheduled. */
  publishedAt?: string | null;
}

export type UpdateArticleBody = Partial<CreateArticleBody>;

export type ArticleResponse = Article;

// ---------- Categories ----------

export interface CreateCategoryBody {
  name: string;
  description?: string;
}

export type UpdateCategoryBody = Partial<CreateCategoryBody>;

// ---------- Users ----------

/** Always creates an Editor account — see createUserSchema's comment. */
export interface CreateUserBody {
  email: string;
  displayName: string;
  password: string;
}

export interface UpdateUserBody {
  displayName?: string;
  role?: UserRole;
  active?: boolean;
  avatarUrl?: string | null;
}

export interface UpdateOwnProfileBody {
  displayName?: string;
  avatarUrl?: string | null;
  currentPassword?: string;
  newPassword?: string;
}

// ---------- Feedback ----------

export interface CreateFeedbackBody {
  message: string;
  name?: string;
}

export interface UpdateFeedbackBody {
  status: FeedbackStatus;
}

// ---------- Positions ----------

export interface CreatePositionBody {
  name: string;
  tier: BoardTier;
  sortOrder?: number;
}

export type UpdatePositionBody = Partial<CreatePositionBody>;

// ---------- Board members ----------

export interface CreateBoardMemberBody {
  name: string;
  positionId: string;
  description?: string;
  imageUrl?: string | null;
  sortOrder?: number;
  userId?: string | null;
}

export type UpdateBoardMemberBody = Partial<CreateBoardMemberBody>;

// ---------- About page ----------

export interface UpdateAboutPageBody {
  heroEyebrow?: string | null;
  heroTitle?: string;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  overview?: string;
  missionPillars?: MissionPillar[];
  achievements?: Achievement[];
}

// ---------- Terms page ----------

export interface UpdateTermsPageBody {
  content?: string;
  /** true = treat this save as a new version, prompting re-acceptance. */
  bumpVersion?: boolean;
}

// ---------- Engagement ----------

export interface EngagementBody {
  /** true = add, false = remove. Mirrors the reader's localStorage toggle. */
  active: boolean;
}

export interface EngagementResponse {
  articleId: string;
  likes: number;
  bookmarks: number;
}

// ---------- Search ----------

export interface SearchQuery {
  q: string;
  category?: string;
  from?: string;
  to?: string;
  page?: number;
  pageSize?: number;
}

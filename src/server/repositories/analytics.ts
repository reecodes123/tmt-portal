/**
 * Analytics/reporting. SERVER ONLY.
 *
 * DATA HONESTY NOTE — read this before adding a new metric here.
 * ------------------------------------------------------------------
 * Two genuinely different kinds of numbers live in this file:
 *
 *   1. TIME-SERIES, real per-day data: `DailyVisit` (one row per calendar
 *      day) and `Article.publishedAt` (a real timestamp per article). These
 *      CAN be honestly filtered to an admin-chosen date range.
 *
 *   2. LIFETIME COUNTERS with no time dimension: `Article.views`, `.likes`,
 *      `.bookmarks`. These are incremented in place (see
 *      repositories/articles.ts's incrementArticleViews/adjustArticleLikes/
 *      adjustArticleBookmarks) — there is no per-day or per-event log of
 *      *when* a view/like/bookmark happened, so "views in the last 7 days"
 *      cannot be computed from what's stored. Every metric derived from
 *      these three columns is unavoidably all-time, and is kept in the
 *      `allTime` bucket below and labelled "All-Time" in the UI rather than
 *      silently pretending it respects the date-range picker. Do not try to
 *      make these "range aware" without first adding real per-event
 *      tracking (a new table + a write on every view) — that's a genuine
 *      architecture change, not a query change.
 */

import { prisma } from "@/server/db";
import type { DailyVisitStat } from "@/types/domain";

// ---------------------------------------------------------------- range

export interface AnalyticsRange {
  /** null = unbounded lower edge ("All Time"). */
  from: Date | null;
  to: Date;
  /** Human label shown in the UI and in exports. */
  label: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

/** Preset keys shown in the date-range selector. */
export const RANGE_PRESETS = [
  { key: "3d", label: "Past 3 Days", days: 3 },
  { key: "7d", label: "Past 7 Days", days: 7 },
  { key: "1m", label: "Past 1 Month", days: 30 },
  { key: "2m", label: "Past 2 Months", days: 60 },
  { key: "3m", label: "Past 3 Months", days: 90 },
  { key: "6m", label: "Past 6 Months", days: 180 },
  { key: "1y", label: "Past 1 Year", days: 365 },
  { key: "all", label: "All Time", days: null },
] as const;

export type RangePresetKey = (typeof RANGE_PRESETS)[number]["key"];

function startOfUtcDay(d: Date): Date {
  const copy = new Date(d);
  copy.setUTCHours(0, 0, 0, 0);
  return copy;
}

/** Resolves a preset key (or explicit custom from/to) into concrete dates. */
export function resolveRange(
  preset: RangePresetKey | null,
  customFrom?: string | null,
  customTo?: string | null
): AnalyticsRange {
  const now = new Date();

  if (preset === null && customFrom) {
    const from = startOfUtcDay(new Date(customFrom));
    const to = customTo ? startOfUtcDay(new Date(customTo)) : startOfUtcDay(now);
    return {
      from,
      to,
      label: `${from.toISOString().slice(0, 10)} to ${to.toISOString().slice(0, 10)}`,
    };
  }

  const found = RANGE_PRESETS.find((p) => p.key === preset) ?? RANGE_PRESETS[2]; // default: 1 month
  if (found.days === null) {
    return { from: null, to: startOfUtcDay(now), label: found.label };
  }
  const from = startOfUtcDay(new Date(now.getTime() - found.days * DAY_MS));
  return { from, to: startOfUtcDay(now), label: found.label };
}

// ---------------------------------------------------------------- visits (real time-series)

export async function getDailyVisitStats(range: AnalyticsRange): Promise<DailyVisitStat[]> {
  const rows = await prisma.dailyVisit.findMany({
    where: {
      date: {
        ...(range.from ? { gte: range.from } : {}),
        lte: range.to,
      },
    },
    orderBy: { date: "asc" },
  });

  return rows.map((r) => ({
    date: r.date.toISOString().slice(0, 10),
    visitors: r.visitors,
  }));
}

// ---------------------------------------------------------------- articles published over time (real, publishedAt-backed)

export interface PublishedBucket {
  /** YYYY-MM-DD for daily buckets, or the Monday of the week for weekly buckets. */
  period: string;
  count: number;
}

export interface CategoryCount {
  categoryName: string;
  count: number;
}

/**
 * Articles published within the range, bucketed by day (short ranges) or by
 * week (longer ranges, so a 1-year view doesn't render 365 bars) — and the
 * same set broken down by category for the donut chart. Both genuinely
 * respect the date range: `publishedAt` is a real per-article timestamp.
 */
export async function getPublishedOverTime(
  range: AnalyticsRange
): Promise<{ overTime: PublishedBucket[]; byCategory: CategoryCount[]; total: number }> {
  const rows = await prisma.article.findMany({
    where: {
      status: "published",
      publishedAt: {
        ...(range.from ? { gte: range.from } : {}),
        lte: new Date(range.to.getTime() + DAY_MS - 1), // inclusive of the "to" day
      },
    },
    select: { publishedAt: true, category: { select: { name: true } } },
  });

  const spanDays = range.from
    ? Math.max(1, Math.round((range.to.getTime() - range.from.getTime()) / DAY_MS))
    : rows.length > 0
      ? Math.max(
          1,
          Math.round(
            (range.to.getTime() -
              Math.min(...rows.map((r) => r.publishedAt!.getTime()))) /
              DAY_MS
          )
        )
      : 1;
  const useWeekly = spanDays > 60;

  const buckets = new Map<string, number>();
  const byCategory = new Map<string, number>();

  for (const row of rows) {
    if (!row.publishedAt) continue;
    const day = startOfUtcDay(row.publishedAt);
    let key: string;
    if (useWeekly) {
      // Bucket to the Monday of that ISO week.
      const monday = new Date(day);
      const dow = (monday.getUTCDay() + 6) % 7; // 0 = Monday
      monday.setUTCDate(monday.getUTCDate() - dow);
      key = monday.toISOString().slice(0, 10);
    } else {
      key = day.toISOString().slice(0, 10);
    }
    buckets.set(key, (buckets.get(key) ?? 0) + 1);

    const catName = row.category?.name ?? "Uncategorized";
    byCategory.set(catName, (byCategory.get(catName) ?? 0) + 1);
  }

  const overTime = Array.from(buckets.entries())
    .map(([period, count]) => ({ period, count }))
    .sort((a, b) => a.period.localeCompare(b.period));

  const byCategoryArr = Array.from(byCategory.entries())
    .map(([categoryName, count]) => ({ categoryName, count }))
    .sort((a, b) => b.count - a.count);

  return { overTime, byCategory: byCategoryArr, total: rows.length };
}

// ---------------------------------------------------------------- all-time engagement (Article.views/likes/bookmarks have no timestamp)

export interface TopArticle {
  id: string;
  slug: string;
  title: string;
  categoryName: string;
  views: number;
  likes: number;
  bookmarks: number;
}

export interface AllTimeAnalytics {
  totalArticles: number;
  publishedArticles: number;
  draftArticles: number;
  inReviewArticles: number;
  needsRevisionArticles: number;
  totalViews: number;
  totalLikes: number;
  totalBookmarks: number;
  activeEditors: number;
  unreadFeedback: number;
  topArticles: TopArticle[];
  viewsByCategory: { categoryName: string; categorySlug: string; views: number }[];
  mostViewedArticle: TopArticle | null;
  mostViewedCategory: { categoryName: string; categorySlug: string; views: number } | null;
}

// Module-scoped, per-process cache for the "all-time" block only. Every
// figure in AllTimeAnalytics comes from columns with no date dimension
// (Article.views/likes/bookmarks, current row counts by status — see this
// file's top comment), so it never depends on the selected date range and
// was previously being recomputed (10 queries) on every single range-picker
// click for no reason — confirmed live in the 2026 pre-deployment audit (3
// consecutive range changes, ~16-20 queries every time, near-identical
// regardless of range). A short TTL rather than write-side invalidation on
// purpose: this is an internal admin dashboard, not a public page, and
// wiring cache-busting into every article/user/feedback mutation would be a
// lot of coupling for "the like count can be up to a minute stale on the
// Analytics page" — an acceptable trade at this app's scale. Range-filtered
// numbers (getDailyVisitStats, getPublishedOverTime) are NOT cached here —
// those must always reflect the exact range requested.
const ALL_TIME_CACHE_TTL_MS = 60_000;
let allTimeCache: { value: AllTimeAnalytics; expiresAt: number } | null = null;

export async function getAllTimeAnalytics(): Promise<AllTimeAnalytics> {
  if (allTimeCache && allTimeCache.expiresAt > Date.now()) {
    return allTimeCache.value;
  }
  const value = await computeAllTimeAnalytics();
  allTimeCache = { value, expiresAt: Date.now() + ALL_TIME_CACHE_TTL_MS };
  return value;
}

async function computeAllTimeAnalytics(): Promise<AllTimeAnalytics> {
  const [
    totalArticles,
    publishedArticles,
    draftArticles,
    inReviewArticles,
    needsRevisionArticles,
    totals,
    activeEditors,
    unreadFeedback,
    topArticleRows,
    categoryViewRows,
  ] = await Promise.all([
    prisma.article.count(),
    prisma.article.count({ where: { status: "published" } }),
    prisma.article.count({ where: { status: "draft" } }),
    prisma.article.count({ where: { status: "in_review" } }),
    prisma.article.count({ where: { status: "needs_revision" } }),
    prisma.article.aggregate({ _sum: { views: true, likes: true, bookmarks: true } }),
    prisma.user.count({ where: { active: true, role: { in: ["editor", "admin"] } } }),
    prisma.feedback.count({ where: { status: "unread" } }),
    prisma.article.findMany({
      where: { status: "published" },
      orderBy: { views: "desc" },
      take: 10,
      select: {
        id: true,
        slug: true,
        title: true,
        views: true,
        likes: true,
        bookmarks: true,
        category: { select: { name: true } },
      },
    }),
    // Grouping by category in JS rather than a raw SQL GROUP BY: article
    // count is small at this app's scale, and this keeps the query a plain
    // Prisma call instead of hand-written SQL for one report field.
    prisma.article.findMany({
      where: { status: "published" },
      select: { views: true, category: { select: { name: true, slug: true } } },
    }),
  ]);

  const topArticles: TopArticle[] = topArticleRows.map((r) => ({
    id: r.id,
    slug: r.slug,
    title: r.title,
    categoryName: r.category?.name ?? "Uncategorized",
    views: r.views,
    likes: r.likes,
    bookmarks: r.bookmarks,
  }));

  const categoryViewMap = new Map<string, { categoryName: string; views: number }>();
  for (const row of categoryViewRows) {
    const slug = row.category?.slug ?? "uncategorized";
    const name = row.category?.name ?? "Uncategorized";
    const existing = categoryViewMap.get(slug);
    categoryViewMap.set(slug, { categoryName: name, views: (existing?.views ?? 0) + row.views });
  }
  const viewsByCategory = Array.from(categoryViewMap.entries())
    .map(([categorySlug, v]) => ({ categorySlug, categoryName: v.categoryName, views: v.views }))
    .sort((a, b) => b.views - a.views);

  return {
    totalArticles,
    publishedArticles,
    draftArticles,
    inReviewArticles,
    needsRevisionArticles,
    totalViews: totals._sum.views ?? 0,
    totalLikes: totals._sum.likes ?? 0,
    totalBookmarks: totals._sum.bookmarks ?? 0,
    activeEditors,
    unreadFeedback,
    topArticles,
    viewsByCategory,
    mostViewedArticle: topArticles[0] ?? null,
    mostViewedCategory: viewsByCategory[0] ?? null,
  };
}

// ---------------------------------------------------------------- visit recording (unchanged behaviour)

export async function recordDailyVisit(date?: string): Promise<void> {
  const day = date ? new Date(`${date}T00:00:00.000Z`) : new Date();
  day.setUTCHours(0, 0, 0, 0);

  await prisma.dailyVisit.upsert({
    where: { date: day },
    create: { date: day, visitors: 1 },
    update: { visitors: { increment: 1 } },
  });
}

/** Composite payload the dashboard/export layer consumes in one call. */
export interface AnalyticsPayload {
  range: { fromISO: string | null; toISO: string; label: string };
  visitsOverTime: DailyVisitStat[];
  totalVisitsInRange: number;
  publishedOverTime: PublishedBucket[];
  articlesPublishedInRange: number;
  articlesByCategoryInRange: CategoryCount[];
  allTime: AllTimeAnalytics;
}

export async function getAnalyticsPayload(range: AnalyticsRange): Promise<AnalyticsPayload> {
  const [visitsOverTime, published, allTime] = await Promise.all([
    getDailyVisitStats(range),
    getPublishedOverTime(range),
    getAllTimeAnalytics(),
  ]);

  return {
    range: {
      fromISO: range.from ? range.from.toISOString().slice(0, 10) : null,
      toISO: range.to.toISOString().slice(0, 10),
      label: range.label,
    },
    visitsOverTime,
    totalVisitsInRange: visitsOverTime.reduce((sum, v) => sum + v.visitors, 0),
    publishedOverTime: published.overTime,
    articlesPublishedInRange: published.total,
    articlesByCategoryInRange: published.byCategory,
    allTime,
  };
}

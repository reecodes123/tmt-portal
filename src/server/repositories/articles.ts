/**
 * Article data access. SERVER ONLY.
 */

import { cache } from "react";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/server/db";
import type { Article, ArticleStatus } from "@/types/domain";
import type {
  ArticleListQuery,
  CreateArticleBody,
  UpdateArticleBody,
} from "@/types/api";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { sanitizeRichText } from "@/server/sanitize";
import { paginate } from "./_shared";
import { toArticle } from "./_mappers";

const DEFAULT_PAGE_SIZE = 12;

/** Always pull the joined names the domain object needs. */
const WITH_RELATIONS = {
  category: { select: { slug: true, name: true } },
  author: { select: { displayName: true } },
} satisfies Prisma.ArticleInclude;

/**
 * Every scalar EXCEPT `content` and `contentImageUrls` — used for list views
 * only (homepage, category pages, dashboard article lists, search). Those two
 * fields are the article's full rich-text body and its embedded-image URLs;
 * no list view renders either (confirmed against ArticleCard, ArticleTable,
 * and CategoryListing before adding this), but every list query was
 * fetching them anyway for every row on the page — a real, measured cost
 * that scales with body size × row count. See the 2026 pre-deployment audit.
 *
 * `getArticleBySlug`/`getArticleById` (the single-article detail and edit
 * paths) deliberately keep using `include: WITH_RELATIONS` below, unchanged
 * — full content always loads there.
 */
const LIST_SELECT = {
  id: true,
  slug: true,
  title: true,
  subheadline: true,
  excerpt: true,
  coverImageUrl: true,
  photoCredit: true,
  articleBy: true,
  featured: true,
  status: true,
  publishedAt: true,
  views: true,
  likes: true,
  bookmarks: true,
  createdAt: true,
  updatedAt: true,
  categoryId: true,
  authorId: true,
  category: { select: { slug: true, name: true } },
  author: { select: { displayName: true } },
} satisfies Prisma.ArticleSelect;

/** Shared filter builder so list endpoints stay consistent. */
function buildWhere(query: ArticleListQuery): Prisma.ArticleWhereInput {
  const where: Prisma.ArticleWhereInput = {};

  if (query.status) where.status = query.status;
  if (query.authorId) where.authorId = query.authorId;
  if (query.featured !== undefined) where.featured = query.featured;
  if (query.category) where.category = { slug: query.category };

  if (query.q) {
    // `contains` on MySQL is a LIKE scan. Fine at student-publication scale;
    // switch to the FULLTEXT index (already declared on the model) if the
    // article count ever makes this slow.
    //
    // Deliberately independent of `excerpt` — that field is legacy and no
    // longer collected (see createArticleSchema), so a search that depended
    // on it would silently stop matching any article created from now on.
    // Searches the fields readers actually see: headline, sub-headline,
    // body, category, and the credited byline (articleBy — the manually
    // entered writer name, not the internal publishing account).
    where.OR = [
      { title: { contains: query.q } },
      { subheadline: { contains: query.q } },
      { content: { contains: query.q } },
      { articleBy: { contains: query.q } },
      { category: { name: { contains: query.q } } },
    ];
  }

  return where;
}

async function listWithWhere(
  where: Prisma.ArticleWhereInput,
  query: ArticleListQuery,
  orderBy: Prisma.ArticleOrderByWithRelationInput
) {
  const page = Math.max(1, query.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, query.pageSize ?? DEFAULT_PAGE_SIZE));

  // One round trip for the page, one for the count.
  const [rows, total] = await Promise.all([
    prisma.article.findMany({
      where,
      orderBy,
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: LIST_SELECT,
    }),
    prisma.article.count({ where }),
  ]);

  return paginate(rows.map(toArticle), page, pageSize, total);
}

/**
 * Published articles for the public site.
 *
 * The `publishedAt <= now` clause is what makes scheduling work: an article
 * saved as `published` with a future date stays hidden until that moment.
 */
export async function listPublishedArticles(query: ArticleListQuery = {}) {
  const where: Prisma.ArticleWhereInput = {
    ...buildWhere(query),
    status: "published",
    publishedAt: { lte: new Date() },
  };

  return listWithWhere(where, query, { publishedAt: "desc" });
}

/** Every article regardless of status — dashboard use. */
export async function listAllArticles(query: ArticleListQuery = {}) {
  return listWithWhere(buildWhere(query), query, { updatedAt: "desc" });
}

/** Articles by one author — the editor's own dashboard view. */
export async function listArticlesByAuthor(
  authorId: string,
  query: ArticleListQuery = {}
) {
  const where: Prisma.ArticleWhereInput = { ...buildWhere(query), authorId };
  return listWithWhere(where, query, { updatedAt: "desc" });
}

/**
 * Wrapped in React's cache() — the public article page calls this from both
 * generateMetadata() and the page body, which are separate invocations in
 * the same request; without this it queried `articles` twice per page view
 * (Prisma happened to batch the two into one `slug IN (?,?)` statement, but
 * it was still duplicate application-level work — measured live in the 2026
 * pre-deployment audit). No write path in this file calls this afterward in
 * the same request, so a save is still visible on the very next request.
 */
export const getArticleBySlug = cache(async (slug: string): Promise<Article | null> => {
  const row = await prisma.article.findUnique({
    where: { slug },
    include: WITH_RELATIONS,
  });
  return row ? toArticle(row) : null;
});

export async function getArticleById(id: string): Promise<Article | null> {
  const row = await prisma.article.findUnique({
    where: { id },
    include: WITH_RELATIONS,
  });
  return row ? toArticle(row) : null;
}

export async function createArticle(
  input: CreateArticleBody & { authorId: string }
): Promise<Article> {
  const category = await prisma.category.findUnique({
    where: { slug: input.categorySlug },
    select: { id: true },
  });
  if (!category) {
    throw new Error(`Unknown category "${input.categorySlug}".`);
  }

  const slug = await uniqueSlug(
    slugify(input.title),
    async (candidate) =>
      (await prisma.article.count({ where: { slug: candidate } })) > 0
  );

  // Publishing with no explicit date means "now".
  const publishedAt =
    input.status === "published"
      ? input.publishedAt
        ? new Date(input.publishedAt)
        : new Date()
      : null;

  const row = await prisma.article.create({
    data: {
      slug,
      title: input.title,
      subheadline: input.subheadline ?? null,
      excerpt: input.excerpt ?? null,
      content: sanitizeRichText(input.content),
      coverImageUrl: input.coverImageUrl,
      photoCredit: input.photoCredit ?? null,
      articleBy: input.articleBy,
      contentImageUrls: input.contentImageUrls ?? [],
      featured: input.featured ?? false,
      status: input.status,
      publishedAt,
      categoryId: category.id,
      authorId: input.authorId,
    },
    include: WITH_RELATIONS,
  });

  return toArticle(row);
}

export async function updateArticle(
  id: string,
  input: UpdateArticleBody
): Promise<Article> {
  const existing = await prisma.article.findUnique({
    where: { id },
    select: { id: true, status: true, publishedAt: true, title: true, excerpt: true, content: true },
  });
  if (!existing) throw new Error("Article not found.");

  const data: Prisma.ArticleUpdateInput = {};

  if (input.title !== undefined) data.title = input.title;
  if (input.subheadline !== undefined) data.subheadline = input.subheadline ?? null;
  if (input.excerpt !== undefined) data.excerpt = input.excerpt ?? null;
  if (input.content !== undefined) data.content = sanitizeRichText(input.content);
  if (input.coverImageUrl !== undefined) data.coverImageUrl = input.coverImageUrl;
  if (input.photoCredit !== undefined) data.photoCredit = input.photoCredit ?? null;
  if (input.articleBy !== undefined) data.articleBy = input.articleBy;
  if (input.contentImageUrls !== undefined) {
    data.contentImageUrls = input.contentImageUrls;
  }
  if (input.featured !== undefined) data.featured = input.featured;

  if (input.categorySlug !== undefined) {
    const category = await prisma.category.findUnique({
      where: { slug: input.categorySlug },
      select: { id: true },
    });
    if (!category) throw new Error(`Unknown category "${input.categorySlug}".`);
    data.category = { connect: { id: category.id } };
  }

  if (input.status !== undefined) {
    data.status = input.status;
    // Stamp publishedAt the first time something goes live, but never
    // overwrite an existing date — that would silently reorder the feed
    // every time a published article is edited.
    if (input.status === "published" && !existing.publishedAt) {
      data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : new Date();
    }
  }

  if (input.publishedAt !== undefined) {
    data.publishedAt = input.publishedAt ? new Date(input.publishedAt) : null;
  }

  // Snapshot the pre-edit state so changes can be reviewed or reverted.
  const [row] = await prisma.$transaction([
    prisma.article.update({ where: { id }, data, include: WITH_RELATIONS }),
    prisma.articleRevision.create({
      data: {
        articleId: id,
        title: existing.title,
        excerpt: existing.excerpt,
        content: existing.content,
        status: existing.status,
        editedById: "system",
        editedByName: "system",
      },
    }),
  ]);

  return toArticle(row);
}

export async function setArticleStatus(
  id: string,
  status: ArticleStatus
): Promise<Article> {
  return updateArticle(id, { status });
}

export async function deleteArticle(id: string): Promise<void> {
  await prisma.article.delete({ where: { id } });
}

// ---------- engagement counters ----------
//
// The only writes an anonymous reader can trigger. No identifier is stored;
// the reader's own state lives in localStorage. Rate-limited per IP at the
// API route layer (see server/rateLimit.ts and the like/bookmark/view routes)
// rather than here, so this repository stays a plain data-access function.

export async function incrementArticleViews(id: string): Promise<void> {
  await prisma.article.update({
    where: { id },
    data: { views: { increment: 1 } },
  });
}

export async function adjustArticleLikes(id: string, delta: 1 | -1): Promise<void> {
  await prisma.article.update({
    where: { id },
    data: { likes: { increment: delta } },
  });
}

export async function adjustArticleBookmarks(
  id: string,
  delta: 1 | -1
): Promise<void> {
  await prisma.article.update({
    where: { id },
    data: { bookmarks: { increment: delta } },
  });
}

/** Fetch several by id — powers the reader's Bookmarks page. */
export async function getArticlesByIds(ids: string[]): Promise<Article[]> {
  if (ids.length === 0) return [];
  const rows = await prisma.article.findMany({
    where: { id: { in: ids }, status: "published" },
    include: WITH_RELATIONS,
  });
  return rows.map(toArticle);
}

/**
 * Category data access. SERVER ONLY.
 *
 * NAMING: the prototypes used "Category" and "Section" interchangeably.
 * "Category" is the only term now.
 */

import { cache } from "react";
import { prisma } from "@/server/db";
import type { Category } from "@/types/domain";
import type { CreateCategoryBody, UpdateCategoryBody } from "@/types/api";
import { slugify, uniqueSlug } from "@/lib/slugify";
import { ConflictError } from "@/app/api/_helpers";
import { toCategory } from "./_mappers";

export async function listCategories(): Promise<Category[]> {
  const rows = await prisma.category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { _count: { select: { articles: true } } },
  });
  return rows.map(toCategory);
}

/**
 * Wrapped in React's cache() — the `[category]` page calls this from both
 * generateMetadata() and the page body; see getArticleBySlug's identical
 * note in repositories/articles.ts. No write path re-reads this within the
 * same request.
 */
export const getCategoryBySlug = cache(async (slug: string): Promise<Category | null> => {
  const row = await prisma.category.findUnique({
    where: { slug },
    include: { _count: { select: { articles: true } } },
  });
  return row ? toCategory(row) : null;
});

export async function getCategoryById(id: string): Promise<Category | null> {
  const row = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { articles: true } } },
  });
  return row ? toCategory(row) : null;
}

/**
 * Public routes that live directly under the site root (`/about`, `/login`,
 * etc.) — a category slug matching one of these would be permanently
 * unreachable at its own URL, since Next.js always resolves a static route
 * before falling through to the `[category]` dynamic route. Checked once,
 * here, rather than duplicated at every call site.
 */
const RESERVED_SLUGS = new Set([
  "about",
  "terms",
  "editor-in-chief",
  "search",
  "bookmarks",
  "articles",
  "login",
  "dashboard",
  "dev",
  "api",
]);

export async function createCategory(
  input: CreateCategoryBody
): Promise<Category> {
  const baseSlug = slugify(input.name);
  if (RESERVED_SLUGS.has(baseSlug)) {
    throw new ConflictError(
      `"${input.name}" would collide with an existing site page (/${baseSlug}). Choose a different name.`
    );
  }

  const slug = await uniqueSlug(
    baseSlug,
    async (candidate) =>
      (await prisma.category.count({ where: { slug: candidate } })) > 0
  );

  // Append rather than pushing new categories to the top of the nav.
  const last = await prisma.category.findFirst({
    orderBy: { sortOrder: "desc" },
    select: { sortOrder: true },
  });

  const row = await prisma.category.create({
    data: {
      name: input.name,
      slug,
      description: input.description ?? null,
      sortOrder: (last?.sortOrder ?? -1) + 1,
    },
    include: { _count: { select: { articles: true } } },
  });

  return toCategory(row);
}

export async function updateCategory(
  id: string,
  input: UpdateCategoryBody
): Promise<Category> {
  const row = await prisma.category.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description ?? null }
        : {}),
    },
    include: { _count: { select: { articles: true } } },
  });
  return toCategory(row);
}

/**
 * Deleting a category that still has articles would orphan them, and the FK
 * is `onDelete: Restrict` so the DB refuses anyway. Check first so the user
 * gets a sentence instead of a constraint violation.
 */
export async function deleteCategory(id: string): Promise<void> {
  const articleCount = await prisma.article.count({ where: { categoryId: id } });

  if (articleCount > 0) {
    throw new ConflictError(
      `This category still has ${articleCount} article${articleCount === 1 ? "" : "s"}. Move or delete them first.`
    );
  }

  await prisma.category.delete({ where: { id } });
}

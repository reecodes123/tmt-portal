/**
 * Rendered per request, not prerendered at build.
 *
 * Two reasons this matters:
 *   1. Editors expect a dashboard change to show on the public site after a
 *      refresh. A statically prerendered page would keep serving build-time
 *      HTML until the next deploy.
 *   2. `next build` would otherwise need a reachable DATABASE_URL to
 *      prerender, which fails on Vercel when the database isn't publicly
 *      accessible from the build container.
 *
 * At student-publication traffic this costs nothing. If load ever becomes a
 * concern, swap to `export const revalidate = 60` for 60-second ISR.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { CategoryListing } from "@/components/public/CategoryListing";
import { listPublishedArticles } from "@/server/repositories/articles";

export const metadata: Metadata = {
  title: "Search",
  description: "Search articles across The Matrix Today.",
  robots: { index: false, follow: true },
};

interface PageProps {
  searchParams: Promise<{ q?: string; category?: string }>;
}

/**
 * Search results.
 *
 * NEW — search was a stated requirement in the proposal, and both prototypes
 * shipped a search box that did nothing (one console.logged the query, the
 * other just held it in state).
 *
 * TODO(backend): swap the in-memory filter in the repository for a MySQL
 * FULLTEXT query — the index is already declared in prisma/schema.prisma.
 */
export default async function SearchPage({ searchParams }: PageProps) {
  const { q = "", category } = await searchParams;
  const trimmed = q.trim();

  const { items } = trimmed
    ? await listPublishedArticles({ q: trimmed, category, pageSize: 60 })
    : { items: [] };

  return (
    <CategoryListing
      title={trimmed ? `Results for “${trimmed}”` : "Search"}
      description={
        trimmed
          ? `${items.length} article${items.length === 1 ? "" : "s"} found.`
          : "Use the search bar above to find articles by title, author, or keyword."
      }
      articles={items}
    />
  );
}

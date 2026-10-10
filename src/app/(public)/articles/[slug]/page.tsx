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
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { getArticleBySlug, listPublishedArticles } from "@/server/repositories/articles";
import { ArticleContent } from "@/components/public/ArticleContent";
import { ArticleEngagementBar } from "@/components/public/ArticleEngagementBar";
import { ShareButtons } from "@/components/public/ShareButtons";
import { ArticleCard } from "@/components/public/ArticleCard";
import { formatDate } from "@/lib/date";

interface PageProps {
  params: Promise<{ slug: string }>;
}

/**
 * Per-article SEO metadata.
 *
 * This is a concrete win from moving to Next.js: the prototype was a client-
 * side SPA, so every article shared one generic <title> and social previews
 * were blank. Each article now emits its own title, description and OG tags.
 */
/**
 * excerpt is a legacy field, no longer collected — most articles won't have
 * one, but a meta/OG description should never be empty (an empty one looks
 * broken when the link is shared). Falls back to a plain-text snippet of
 * the body: strip tags, collapse whitespace, cut to a reasonable length.
 */
function metaDescription(excerpt: string | null, content: string): string {
  if (excerpt) return excerpt;
  const plainText = content.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return plainText.length > 200 ? `${plainText.slice(0, 200)}…` : plainText;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);
  if (!article) return { title: "Article not found" };

  const description = metaDescription(article.excerpt, article.content);

  return {
    title: article.title,
    description,
    openGraph: {
      title: article.title,
      description,
      type: "article",
      publishedTime: article.publishedAt ?? undefined,
      authors: [article.articleBy],
      images: article.coverImageUrl ? [article.coverImageUrl] : undefined,
    },
  };
}

export default async function ArticlePage({ params }: PageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article || article.status !== "published") {
    notFound();
  }

  const { items: related } = await listPublishedArticles({
    category: article.categorySlug,
    pageSize: 4,
  });
  const moreLikeThis = related.filter((a) => a.id !== article.id).slice(0, 3);

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      <Link
        href={`/${article.categorySlug}`}
        className="inline-flex items-center gap-2 text-tmt-orange hover:text-tmt-orange-light font-semibold mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Back to {article.categoryName ?? article.categorySlug}
      </Link>

      {/*
        Article body is stored as HTML from the rich-text editor, sanitized
        server-side on write (see server/sanitize.ts, applied in
        repositories/articles.ts) — the stored value is already safe, so
        ArticleContent doesn't need to (and doesn't) sanitize again here.
      */}
      <ArticleContent
        categoryLabel={article.categoryName ?? article.categorySlug}
        title={article.title}
        subheadline={article.subheadline}
        articleBy={article.articleBy}
        dateLabel={formatDate(article.publishedAt)}
        viewsLabel={`${article.views.toLocaleString()} views`}
        coverImageUrl={article.coverImageUrl}
        photoCredit={article.photoCredit}
        contentHtml={article.content}
      />

      <ArticleEngagementBar
        articleId={article.id}
        initialLikes={article.likes}
        initialBookmarks={article.bookmarks}
      />

      <ShareButtons title={article.title} slug={article.slug} />

      {moreLikeThis.length > 0 && (
        <section className="mt-14">
          <h2 className="text-2xl font-bold text-tmt-navy mb-6">
            More from {article.categoryName ?? article.categorySlug}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {moreLikeThis.map((a) => (
              <ArticleCard key={a.id} article={a} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}

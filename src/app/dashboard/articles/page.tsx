import Link from "next/link";
import { Plus, X } from "lucide-react";
import { ArticleTable } from "@/components/dashboard/ArticleTable";
import { getCurrentUser } from "@/server/auth";
import { canApproveArticles } from "@/server/permissions";
import {
  listAllArticles,
  listArticlesByAuthor,
} from "@/server/repositories/articles";
import { ARTICLE_STATUS_LABELS, type ArticleStatus } from "@/types/domain";

interface PageProps {
  searchParams: Promise<{ status?: string; category?: string }>;
}

const VALID_STATUSES: ArticleStatus[] = ["draft", "in_review", "needs_revision", "published"];

/**
 * Accepts `?status=` / `?category=` — this is what makes the dashboard's
 * statistic cards (e.g. "Published Articles") genuine navigation instead of
 * a static number: they link here with a filter, and this page applies it
 * through the exact same `ArticleListQuery` the repository already
 * supported (see server/repositories/articles.ts's buildWhere()) — no new
 * filtering logic, just wiring the URL to what already existed.
 */
export default async function ArticlesListPage({ searchParams }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { status: rawStatus, category } = await searchParams;
  const status = VALID_STATUSES.includes(rawStatus as ArticleStatus)
    ? (rawStatus as ArticleStatus)
    : undefined;

  const query = { pageSize: 60, status, category };
  const { items } =
    user.role === "admin"
      ? await listAllArticles(query)
      : await listArticlesByAuthor(user.id, query);

  const hasFilter = Boolean(status || category);

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">Articles</h1>
          {hasFilter && (
            <div className="flex flex-wrap items-center gap-2 mt-2">
              {status && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-tmt-orange/10 text-tmt-orange">
                  {ARTICLE_STATUS_LABELS[status]}
                </span>
              )}
              {category && (
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-tmt-navy/10 text-tmt-navy capitalize">
                  {category}
                </span>
              )}
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-tmt-navy"
              >
                <X size={12} /> Clear filter
              </Link>
            </div>
          )}
        </div>
        <Link
          href="/dashboard/articles/new"
          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors w-fit"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">New Article</span>
        </Link>
      </div>

      <ArticleTable
        articles={items}
        viewerRole={user.role}
        viewerId={user.id}
        viewerCanApprove={canApproveArticles(user)}
      />
    </div>
  );
}

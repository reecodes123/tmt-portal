"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle2, Eye, Heart, PenSquare, RotateCcw, Trash2 } from "lucide-react";
import { deleteArticle, updateArticle } from "@/lib/api-client";
import { canDeleteArticle } from "@/server/permissions";
import { ARTICLE_STATUS_LABELS, type Article, type UserRole } from "@/types/domain";

interface Props {
  articles: Article[];
  viewerRole: UserRole;
  viewerId: string;
  /**
   * Whether the signed-in account currently has article-approval authority
   * — true for every admin, and for an editor only if the EIC has delegated
   * it (see server/permissions.ts's canApproveArticles()). Computed
   * server-side by the page and passed down; the Approve/Request Revision
   * buttons below are hidden when this is false purely for UX — the API
   * independently rejects the same actions regardless of what the client
   * shows, so hiding the buttons is not the actual security boundary.
   */
  viewerCanApprove: boolean;
}

const STATUS_STYLES: Record<Article["status"], string> = {
  draft: "bg-amber-100 text-amber-700",
  in_review: "bg-blue-100 text-blue-700",
  needs_revision: "bg-rose-100 text-rose-700",
  published: "bg-green-100 text-green-700",
};

/**
 * Article list used by both /dashboard/articles and /dashboard/drafts.
 *
 * Shared because the two views are visually identical — only the filter
 * differs, and that's applied by the parent page. Extracting this component
 * kept the two dashboard routes from duplicating ~80 lines of JSX.
 */
export function ArticleTable({ articles, viewerRole, viewerId, viewerCanApprove }: Props) {
  const [items, setItems] = useState(articles);
  const [busy, setBusy] = useState<string | null>(null);

  const handleDelete = async (article: Article) => {
    // Client-side check for UX. The DELETE endpoint MUST re-check.
    // canApproveArticles is irrelevant to canDeleteArticle's logic but
    // required by the shared SessionUser shape — false is a safe filler.
    if (
      !canDeleteArticle(
        { id: viewerId, role: viewerRole, active: true, canApproveArticles: false },
        article
      )
    ) {
      return;
    }

    if (!window.confirm("Delete this article permanently?")) return;
    setBusy(article.id);
    try {
      await deleteArticle(article.id);
      setItems((prev) => prev.filter((a) => a.id !== article.id));
    } catch (err) {
      alert(err instanceof Error ? err.message : "Delete failed.");
    } finally {
      setBusy(null);
    }
  };

  const handleReviewDecision = async (
    article: Article,
    status: "published" | "needs_revision"
  ) => {
    if (
      status === "needs_revision" &&
      !window.confirm(`Send "${article.title}" back for revision?`)
    ) {
      return;
    }
    setBusy(article.id);
    try {
      const updated = await updateArticle(article.id, { status });
      setItems((prev) => prev.map((a) => (a.id === article.id ? updated : a)));
    } catch (err) {
      // Covers both a genuine server error and the case where the API
      // correctly rejected this because approval authority was revoked
      // between page load and this click — the server check is what
      // actually matters here, this button is just convenience.
      alert(err instanceof Error ? err.message : "Could not update this article.");
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center">
        <p className="text-gray-500">No articles here yet.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      <div className="divide-y divide-gray-100">
        {items.map((article) => {
          const mayEdit =
            viewerRole === "admin" || article.authorId === viewerId;
          const mayReview = viewerCanApprove && article.status === "in_review";

          return (
            <div
              key={article.id}
              className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 sm:p-5 hover:bg-gray-50 transition-colors"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={article.coverImageUrl}
                alt=""
                className="w-full sm:w-20 h-32 sm:h-14 object-cover rounded-lg shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-tmt-navy truncate">
                  {article.title}
                </p>
                <p className="text-xs text-gray-500 capitalize">
                  {article.categoryName ?? article.categorySlug} &middot;{" "}
                  {article.authorName}
                </p>
              </div>
              <div className="flex items-center gap-4 text-xs text-gray-500 shrink-0">
                <span className="flex items-center gap-1">
                  <Eye size={14} /> {article.views}
                </span>
                <span className="flex items-center gap-1">
                  <Heart size={14} /> {article.likes}
                </span>
                <span
                  className={`font-semibold px-2.5 py-1 rounded-full ${STATUS_STYLES[article.status]}`}
                >
                  {ARTICLE_STATUS_LABELS[article.status]}
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-2 shrink-0">
                {mayReview && (
                  <>
                    <button
                      onClick={() => handleReviewDecision(article, "published")}
                      disabled={busy === article.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <CheckCircle2 size={14} /> Approve
                    </button>
                    <button
                      onClick={() => handleReviewDecision(article, "needs_revision")}
                      disabled={busy === article.id}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-semibold transition-colors disabled:opacity-50"
                    >
                      <RotateCcw size={14} /> Request Revision
                    </button>
                  </>
                )}
                {mayEdit && (
                  <Link
                    href={`/dashboard/articles/${article.id}/edit`}
                    className="p-2 rounded-lg text-gray-500 hover:bg-tmt-orange/10 hover:text-tmt-orange transition-colors"
                    aria-label="Edit"
                  >
                    <PenSquare size={16} />
                  </Link>
                )}
                {mayEdit && (
                  <button
                    onClick={() => handleDelete(article)}
                    disabled={busy === article.id}
                    className="p-2 rounded-lg text-gray-500 hover:bg-red-50 hover:text-red-600 transition-colors disabled:opacity-50"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

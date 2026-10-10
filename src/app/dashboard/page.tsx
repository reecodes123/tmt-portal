import Link from "next/link";
import {
  Bookmark,
  FileClock,
  FileText,
  Heart,
  MessageSquare,
  PenSquare,
} from "lucide-react";
import { StatCard } from "@/components/dashboard/StatCard";
import { getCurrentUser } from "@/server/auth";
import {
  listAllArticles,
  listArticlesByAuthor,
} from "@/server/repositories/articles";
import { listFeedback } from "@/server/repositories/feedback";
import { formatDate } from "@/lib/date";
import { ARTICLE_STATUS_LABELS } from "@/types/domain";

export default async function DashboardHomePage() {
  const user = await getCurrentUser();
  if (!user) return null; // layout already redirected

  const [{ items: articles }, feedback] = await Promise.all([
    user.role === "admin"
      ? listAllArticles({ pageSize: 60 })
      : listArticlesByAuthor(user.id, { pageSize: 60 }),
    user.role === "admin" ? listFeedback() : Promise.resolve([]),
  ]);

  const published = articles.filter((a) => a.status === "published");
  const drafts = articles.filter((a) => a.status === "draft");
  const totalLikes = articles.reduce((sum, a) => sum + a.likes, 0);
  const totalBookmarks = articles.reduce((sum, a) => sum + a.bookmarks, 0);
  const unreadFeedback = feedback.filter((f) => f.status === "unread").length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
            Welcome back, {user.displayName.split(" ")[0]}
          </h1>
          <p className="text-gray-500 mt-1">
            Here&apos;s what&apos;s happening with{" "}
            {user.role === "admin" ? "the publication" : "your articles"}.
          </p>
        </div>
        <Link
          href="/dashboard/articles/new"
          className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors w-fit"
        >
          <PenSquare size={18} />
          New Article
        </Link>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard
          label="Published Articles"
          value={published.length}
          icon={FileText}
          href="/dashboard/articles?status=published"
        />
        <StatCard
          label="Drafts"
          value={drafts.length}
          icon={FileClock}
          accent="navy"
          href="/dashboard/drafts"
        />
        <StatCard
          label="Total Likes"
          value={totalLikes}
          icon={Heart}
          href="/dashboard/analytics"
        />
        <StatCard
          label="Total Bookmarks"
          value={totalBookmarks}
          icon={Bookmark}
          accent="navy"
          href="/dashboard/analytics"
        />
        {user.role === "admin" && (
          <StatCard
            label="Unread Feedback"
            value={unreadFeedback}
            icon={MessageSquare}
            href="/dashboard/feedback"
          />
        )}
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="text-lg font-bold text-tmt-navy mb-4">
          {user.role === "admin" ? "Recently Updated" : "Your Recent Articles"}
        </h2>
        {articles.length === 0 ? (
          <p className="text-gray-500 text-sm">
            No articles yet. Create your first one!
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {articles.slice(0, 6).map((article) => (
              <Link
                key={article.id}
                href={`/dashboard/articles/${article.id}/edit`}
                className="flex items-center justify-between gap-4 py-3 hover:bg-gray-50 -mx-2 px-2 rounded-lg transition-colors"
              >
                <div className="min-w-0">
                  <p className="font-medium text-tmt-navy truncate">
                    {article.title}
                  </p>
                  <p className="text-xs text-gray-500">
                    {article.authorName} &middot;{" "}
                    {formatDate(article.updatedAt || article.publishedAt)}
                  </p>
                </div>
                <span
                  className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${
                    article.status === "published"
                      ? "bg-green-100 text-green-700"
                      : article.status === "in_review"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-amber-100 text-amber-700"
                  }`}
                >
                  {ARTICLE_STATUS_LABELS[article.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

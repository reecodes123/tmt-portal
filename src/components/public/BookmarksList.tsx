"use client";

import { useEffect, useState } from "react";
import { Bookmark } from "lucide-react";
import { ArticleCard } from "./ArticleCard";
import { LoadingSpinner } from "@/components/shared/LoadingSpinner";
import { useLocalBookmarks } from "@/hooks/useLocalBookmarks";
import { fetchArticles } from "@/lib/api-client";
import type { Article } from "@/types/domain";

/**
 * Reader's saved articles.
 *
 * Necessarily a Client Component: the bookmark list lives in localStorage, so
 * the server has no idea what to render. Everything else on the public site is
 * server-rendered.
 */
export function BookmarksList() {
  const { ids, hydrated } = useLocalBookmarks();
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!hydrated) return;

    if (ids.size === 0) {
      setArticles([]);
      setLoading(false);
      return;
    }

    fetchArticles({ pageSize: "60" })
      .then((res) => setArticles(res.items.filter((a) => ids.has(a.id))))
      .catch(() => setArticles([]))
      .finally(() => setLoading(false));
  }, [hydrated, ids]);

  if (!hydrated || loading) return <LoadingSpinner />;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      <div className="mb-8 sm:mb-10 text-center">
        <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-tmt-navy text-tmt-orange-light mb-4">
          <Bookmark size={26} />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold text-tmt-navy mb-3">
          Your Bookmarks
        </h1>
        <p className="text-gray-600 max-w-xl mx-auto">
          Saved in this browser only — bookmark an article to find it again later.
        </p>
        <div className="h-1 w-24 bg-gradient-to-r from-tmt-orange to-tmt-orange-light mx-auto mt-6 rounded-full" />
      </div>

      {articles.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            You haven&apos;t bookmarked any articles yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      )}
    </div>
  );
}

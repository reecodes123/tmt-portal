import Link from "next/link";
import { Calendar, User } from "lucide-react";
import type { Article } from "@/types/domain";
import { formatDateShort } from "@/lib/date";

interface ArticleCardProps {
  article: Article;
  featured?: boolean;
}

/**
 * Article teaser card.
 *
 * Now links by slug (/articles/[slug]) rather than the prototype's opaque
 * /article/:id, so URLs are readable and indexable.
 */
export function ArticleCard({ article, featured = false }: ArticleCardProps) {
  return (
    <Link
      href={`/articles/${article.slug}`}
      className={`group block bg-white rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${
        featured ? "md:col-span-2 md:row-span-2" : ""
      }`}
    >
      <div className={`relative overflow-hidden ${featured ? "h-80" : "h-48"}`}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={article.coverImageUrl}
          alt=""
          loading="lazy"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 left-4">
          <span className="inline-block px-3 py-1 bg-tmt-orange text-white text-xs font-semibold rounded-full uppercase">
            {article.categoryName ?? article.categorySlug}
          </span>
        </div>
      </div>

      <div className="p-4 sm:p-6">
        <h3
          className={`font-bold text-tmt-navy mb-2 line-clamp-2 group-hover:text-tmt-orange transition-colors ${
            featured ? "text-2xl" : "text-lg"
          }`}
        >
          {article.title}
        </h3>

        {/* excerpt is a legacy field, no longer collected — most new
            articles won't have one, so this line just doesn't render. */}
        {article.excerpt && (
          <p className="text-gray-600 mb-4 line-clamp-2">{article.excerpt}</p>
        )}

        <div className="flex items-center gap-4 text-sm text-gray-500">
          <span className="flex items-center gap-1">
            <User size={14} />
            {/* The manually entered byline, not the publishing account —
                must match what the article's own page shows. */}
            {article.articleBy}
          </span>
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {formatDateShort(article.publishedAt)}
          </span>
        </div>
      </div>
    </Link>
  );
}

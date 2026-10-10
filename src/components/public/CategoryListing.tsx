import { ArticleCard } from "./ArticleCard";
import type { Article } from "@/types/domain";

interface CategoryListingProps {
  title: string;
  description: string;
  articles: Article[];
}

/**
 * Shared layout for every category page.
 *
 * Replaces the prototype's CategoryPage.tsx. That version fetched its own data
 * client-side; this one receives already-fetched articles, so the six category
 * pages stay Server Components.
 */
export function CategoryListing({
  title,
  description,
  articles,
}: CategoryListingProps) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
      <div className="mb-8 sm:mb-10 text-center">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-tmt-navy mb-3 sm:mb-4">
          {title}
        </h1>
        <p className="text-base sm:text-lg text-gray-600 max-w-3xl mx-auto">
          {description}
        </p>
        <div className="h-1 w-24 bg-gradient-to-r from-tmt-orange to-tmt-orange-light mx-auto mt-5 sm:mt-6 rounded-full" />
      </div>

      {articles.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
          {articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg">
            No articles in this category yet. Check back soon.
          </p>
        </div>
      )}
    </div>
  );
}

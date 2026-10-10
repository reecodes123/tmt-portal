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

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ArticleCard } from "@/components/public/ArticleCard";
import { DecorativeGear } from "@/components/public/DecorativeGear";
import { listPublishedArticles } from "@/server/repositories/articles";
import { getSettings } from "@/server/repositories/settings";

const teamPhoto = "/images/team-photo.png";

/**
 * Homepage — a Server Component.
 *
 * The prototype fetched articles in a useEffect after mount, which meant a
 * spinner on every visit and nothing for search engines to index. Fetching on
 * the server means the HTML arrives already populated.
 */
export default async function HomePage() {
  const [{ items: articles }, settings] = await Promise.all([
    listPublishedArticles({ pageSize: 60 }),
    getSettings(),
  ]);

  const featured = articles.filter((a) => a.featured);
  const latestNews = articles.filter((a) => a.categorySlug === "news").slice(0, 3);
  const latestFeatures = articles
    .filter((a) => a.categorySlug === "features")
    .slice(0, 2);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12 relative">
      <DecorativeGear
        className="absolute top-10 right-10 text-tmt-orange animate-spin-slow hidden sm:block"
        size={120}
      />
      <DecorativeGear
        className="absolute top-1/3 left-10 text-tmt-orange-light animate-spin-reverse hidden sm:block"
        size={80}
      />

      {settings.announcement ? (
        <div className="relative z-10 mb-8 rounded-xl border border-tmt-orange/30 bg-tmt-orange/10 px-5 py-4 text-tmt-navy">
          {settings.announcement}
        </div>
      ) : null}

      {featured.length > 0 && (
        <section className="mb-10 sm:mb-14 relative z-10">
          <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-5 sm:mb-6">
            Featured Stories
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {featured.map((article, i) => (
              <ArticleCard key={article.id} article={article} featured={i === 0} />
            ))}
          </div>
        </section>
      )}

      <section className="mb-10 sm:mb-14">
        <div className="relative rounded-2xl overflow-hidden shadow-2xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={teamPhoto}
            alt="The Matrix Today editorial team"
            className="w-full h-64 sm:h-80 lg:h-96 object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-tmt-navy/90 via-tmt-navy/40 to-transparent flex items-end">
            <div className="p-5 sm:p-8 text-white">
              <h2 className="text-2xl sm:text-3xl font-bold mb-2">Our Team</h2>
              <p className="text-base sm:text-lg max-w-xl">
                Passionate individuals committed to bringing you the latest in
                engineering excellence
              </p>
            </div>
          </div>
        </div>
      </section>

      {latestNews.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
              Latest News
            </h2>
            <Link
              href="/news"
              className="flex items-center gap-2 text-tmt-orange hover:text-tmt-orange-light font-semibold transition-colors"
            >
              View All <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {latestNews.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}

      {latestFeatures.length > 0 && (
        <section className="mb-10 sm:mb-14">
          <div className="flex items-center justify-between mb-5 sm:mb-6">
            <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
              Features
            </h2>
            <Link
              href="/features"
              className="flex items-center gap-2 text-tmt-orange hover:text-tmt-orange-light font-semibold transition-colors"
            >
              View All <ArrowRight size={20} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-6">
            {latestFeatures.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

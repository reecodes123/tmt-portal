import { resolveIcon } from "@/lib/icons";
import type { AboutPage } from "@/types/domain";

interface Props {
  page: AboutPage;
}

/**
 * Renders the About Us page from `AboutPage` (DB-backed, dashboard-editable
 * at /dashboard/pages/about). The layout/styling is unchanged from the
 * original static version — only the data source moved.
 */
export function AboutContent({ page }: Props) {
  return (
    <div className="pb-14 sm:pb-16">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={page.heroImageUrl ?? "/images/team-photo.png"}
            alt={`${page.heroTitle} Team`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-tmt-navy/95 via-tmt-navy/85 to-tmt-orange/60" />
        </div>
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 lg:py-24 text-center text-white">
          {page.heroEyebrow && (
            <p className="text-sm font-semibold uppercase tracking-widest text-tmt-orange-light mb-3">
              {page.heroEyebrow}
            </p>
          )}
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            {page.heroTitle}
          </h1>
          {page.heroSubtitle && (
            <p className="text-base sm:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
              {page.heroSubtitle}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 -mt-10 sm:-mt-12 relative z-10">
        {/* Overview card */}
        <div
          className="bg-white rounded-2xl shadow-xl p-6 sm:p-10 prose prose-sm sm:prose-base max-w-none text-gray-700 [&_p]:leading-relaxed [&_p+p]:mt-5"
          dangerouslySetInnerHTML={{ __html: page.overview }}
        />

        {/* Mission pillars */}
        {page.missionPillars.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6 mt-8 sm:mt-10">
            {page.missionPillars.map((pillar, i) => {
              const Icon = resolveIcon(pillar.icon);
              return (
                <div
                  key={i}
                  className="bg-white rounded-xl shadow-md p-6 text-center hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300"
                >
                  <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-tmt-orange/10 text-tmt-orange mb-3">
                    <Icon size={22} />
                  </div>
                  <h3 className="font-bold text-tmt-navy mb-1">{pillar.label}</h3>
                  <p className="text-sm text-gray-600">{pillar.description}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* Achievements timeline */}
        {page.achievements.length > 0 && (
          <div className="mt-12 sm:mt-14">
            <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-8 text-center">
              Achievement Highlights
            </h2>
            <div className="space-y-5 sm:space-y-6">
              {page.achievements.map((achievement, i) => {
                const Icon = resolveIcon(achievement.icon);
                return (
                  <div
                    key={i}
                    className="flex items-start gap-4 sm:gap-5 bg-white rounded-xl shadow-md p-5 sm:p-6 hover:shadow-lg transition-shadow duration-300"
                  >
                    <div className="shrink-0 flex flex-col items-center">
                      <div className="w-11 h-11 rounded-full bg-tmt-navy text-tmt-orange-light flex items-center justify-center">
                        <Icon size={20} />
                      </div>
                      <span className="text-xs font-semibold text-gray-400 mt-1">
                        {achievement.year}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-bold text-tmt-navy mb-1">
                        {achievement.title}
                      </h3>
                      <p className="text-sm sm:text-base text-gray-600 leading-relaxed">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

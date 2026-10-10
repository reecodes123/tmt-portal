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
import { Users2 } from "lucide-react";
import { EditorialOrgChart } from "@/components/public/EditorialOrgChart";
import { EditorSpotlight } from "@/components/public/EditorSpotlight";
import { DecorativeGear } from "@/components/public/DecorativeGear";
import { listBoardMembers } from "@/server/repositories/boardMembers";
import { getSettings } from "@/server/repositories/settings";

/** Dynamic (not a static object) so the description reflects the current
 *  dashboard-set academic year rather than a build-time literal. */
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSettings();
  return {
    title: "Editorial Board",
    description: `The Editorial Board and Staff of The Matrix Today, Academic Year ${settings.academicYear}.`,
  };
}

export default async function EditorialBoardPage() {
  const [members, settings] = await Promise.all([
    listBoardMembers(),
    getSettings(),
  ]);

  return (
    <div className="pb-14 sm:pb-16">
      {/* Hero — same "gradient banner + decorative gears" language the site
          already uses (Header.tsx, homepage), given its own composition
          rather than reused wholesale, since this page's job (introduce an
          org chart) is different from the sitewide masthead banner. */}
      <div className="relative overflow-hidden bg-gradient-to-br from-tmt-navy via-tmt-navy to-tmt-orange/80">
        <div className="absolute inset-0 bg-tmt-navy/40" />
        <DecorativeGear
          className="absolute -top-4 right-6 text-tmt-orange-light animate-spin-slow hidden sm:block"
          size={110}
        />
        <DecorativeGear
          className="absolute bottom-0 left-4 text-white animate-spin-reverse hidden lg:block"
          size={80}
        />
        <div className="relative max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24 text-center text-white">
          <div className="inline-flex items-center justify-center w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-white/10 backdrop-blur-sm text-tmt-orange-light mb-5 shadow-lg ring-1 ring-white/20">
            <Users2 size={28} />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-tmt-orange-light mb-3">
            The Matrix Today (TMT)
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            Editorial Board &amp; Staff
          </h1>
          <p className="text-base sm:text-lg text-white/85 max-w-2xl mx-auto leading-relaxed">
            Meet the student journalists, editors, and creatives behind The Matrix
            Today — Academic Year {settings.academicYear}.
          </p>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 -mt-8 sm:-mt-10 relative z-10">
        <EditorSpotlight members={members} />

        <div className="bg-white rounded-2xl shadow-xl p-5 sm:p-8 lg:p-10">
          <div className="text-center mb-8 sm:mb-10">
            <h2 className="text-xl sm:text-2xl font-bold text-tmt-navy mb-2">
              Organizational Chart
            </h2>
            <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
              Our editorial hierarchy, from masthead leadership down to our
              writers and creative staff.
            </p>
            <div className="h-1 w-16 bg-gradient-to-r from-tmt-orange to-tmt-orange-light mx-auto mt-4 rounded-full" />
          </div>

          {/* Every tier renders (even empty ones) so the site menu's
              staff-role links always land on a real, labelled section. */}
          <EditorialOrgChart members={members} showEmptyTiers />
        </div>
      </div>
    </div>
  );
}

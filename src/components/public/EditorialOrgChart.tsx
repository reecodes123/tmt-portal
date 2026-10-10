import { User } from "lucide-react";
import type { BoardMember, BoardTier } from "@/types/domain";
import { TIER_LABELS, TIER_ORDER, tierAnchorId } from "@/types/domain";

interface EditorialOrgChartProps {
  members: BoardMember[];
  /**
   * When true, every tier renders even if it has no members yet, each with an
   * anchor id so the site menu can deep-link to a staff section and land on a
   * real heading rather than a missing fragment. Empty tiers render as a
   * single compact line (not a full card slot) so a masthead with many
   * currently-unfilled roles doesn't turn into a wall of empty space.
   */
  showEmptyTiers?: boolean;
}

/** How much visual weight a tier's cards carry — larger/bolder near the top
 *  of the masthead, compact for the rank-and-file sections, so the chart
 *  reads as a hierarchy at a glance instead of a uniform grid. */
type Weight = "primary" | "secondary" | "standard";

function weightForLevel(levelIndex: number): Weight {
  if (levelIndex === 0 || levelIndex === 1) return "primary"; // Adviser, Editor-in-Chief
  if (levelIndex === 2) return "secondary"; // Editorial leadership
  return "standard";
}

const CARD_WIDTH: Record<Weight, string> = {
  primary: "w-[78%] max-w-[15rem] sm:w-56 sm:max-w-none",
  secondary: "w-[58%] max-w-[13rem] sm:w-48 sm:max-w-none",
  standard: "w-[45%] min-w-[128px] sm:w-40 lg:w-44",
};

const PHOTO_SIZE: Record<Weight, string> = {
  primary: "w-20 h-20 sm:w-24 sm:h-24",
  secondary: "w-16 h-16 sm:w-20 sm:h-20",
  standard: "w-14 h-14 sm:w-16 sm:h-16",
};

function MemberCard({ member, weight }: { member: BoardMember; weight: Weight }) {
  const isPrimary = weight === "primary";
  return (
    <div
      className={`group relative flex flex-col items-center text-center rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 ${CARD_WIDTH[weight]} ${
        isPrimary
          ? "bg-gradient-to-br from-tmt-navy to-tmt-navy-light text-white p-4 sm:p-6"
          : "bg-white text-tmt-navy p-3 sm:p-4"
      }`}
    >
      <div
        className={`rounded-full overflow-hidden flex items-center justify-center mb-2.5 sm:mb-3 ring-4 transition-transform duration-300 group-hover:scale-105 ${PHOTO_SIZE[weight]} ${
          isPrimary ? "ring-tmt-orange/50 bg-white/10" : "ring-tmt-orange/15 bg-tmt-navy/5"
        }`}
      >
        {member.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={member.imageUrl} alt={member.name} className="w-full h-full object-cover" />
        ) : (
          <User
            size={isPrimary ? 34 : 24}
            className={isPrimary ? "text-white/70" : "text-tmt-navy/30"}
          />
        )}
      </div>
      <p
        className={`font-bold leading-snug break-words ${
          isPrimary ? "text-base sm:text-lg" : "text-xs sm:text-sm"
        }`}
      >
        {member.name}
      </p>
      <p
        className={`font-semibold uppercase tracking-wide mt-1 leading-snug break-words ${
          isPrimary ? "text-xs sm:text-sm text-tmt-orange-light" : "text-[10px] sm:text-xs text-tmt-orange"
        }`}
      >
        {member.positionName}
      </p>
      {isPrimary && member.description && (
        <p className="text-xs sm:text-sm mt-2.5 leading-relaxed text-white/80">
          {member.description}
        </p>
      )}
    </div>
  );
}

/** Thin vertical connector between two levels of the chart, with small node
 *  dots so the hierarchy reads as a flowchart rather than a plain divider. */
function LevelConnector() {
  return (
    <div className="flex flex-col items-center">
      <span className="w-1.5 h-1.5 rounded-full bg-tmt-orange/50" />
      <div className="h-5 sm:h-7 w-0.5 bg-gradient-to-b from-tmt-orange/50 to-tmt-orange/15" />
    </div>
  );
}

/**
 * Renders the editorial board/staff roster as an organizational chart, one
 * level per hierarchy tier, connected by a vertical spine. Shared by the
 * public Editorial Board page and the Admin/EIC dashboard's org-chart
 * preview, so what an admin previews is pixel-for-pixel what readers see.
 *
 * Layout notes:
 *  - Tier grouping/order is entirely derived from BoardTier / TIER_ORDER —
 *    nothing about which tiers exist or how members are grouped is
 *    hardcoded here; this file only decides how to *draw* whatever the data
 *    contains.
 *  - Mobile never relies on horizontal scrolling: member rows are a 2-column
 *    grid (or a centered flex row for 1-2 members) that wraps naturally,
 *    switching to a fixed-width centered flex layout from `sm:` up. Long
 *    names/positions wrap (`break-words`) instead of being clipped.
 */
export function EditorialOrgChart({ members, showEmptyTiers = false }: EditorialOrgChartProps) {
  const byTier = new Map<BoardTier, BoardMember[]>();
  for (const tier of TIER_ORDER) byTier.set(tier, []);
  for (const member of members) {
    if (!byTier.has(member.positionTier)) byTier.set(member.positionTier, []);
    byTier.get(member.positionTier)!.push(member);
  }

  const levels = TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    members: (byTier.get(tier) ?? []).sort((a, b) => a.sortOrder - b.sortOrder),
  })).filter((level) => showEmptyTiers || level.members.length > 0);

  return (
    <div className="flex flex-col items-center w-full">
      {levels.map((level, levelIndex) => {
        const weight = weightForLevel(levelIndex);
        const isEmpty = level.members.length === 0;

        return (
          <div
            key={level.tier}
            id={tierAnchorId(level.tier)}
            className="w-full flex flex-col items-center scroll-mt-24"
          >
            {levelIndex > 0 && <LevelConnector />}

            {isEmpty ? (
              // Compact single line — keeps the anchor + label real (so
              // site-menu deep links always land somewhere) without a tier
              // with no members yet costing a full card-height of blank space.
              <div className="flex items-center gap-2 py-1.5">
                <span className="text-[11px] sm:text-xs font-bold uppercase tracking-widest text-tmt-navy/40">
                  {level.label}
                </span>
                <span className="text-xs text-gray-300 italic">— no members listed yet</span>
              </div>
            ) : (
              <div className="w-full flex flex-col items-center pb-2">
                <span
                  className={`inline-flex items-center rounded-full mb-3 sm:mb-4 font-bold uppercase tracking-widest ${
                    weight === "primary"
                      ? "text-xs sm:text-sm px-4 py-1.5 bg-tmt-navy text-tmt-orange-light shadow-sm"
                      : "text-[11px] sm:text-xs px-3 py-1 bg-tmt-orange/10 text-tmt-orange"
                  }`}
                >
                  {level.label}
                </span>

                <div className="w-full flex flex-wrap justify-center gap-3 sm:gap-5">
                  {level.members.map((member) => (
                    <MemberCard key={member.id} member={member} weight={weight} />
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

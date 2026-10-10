/**
 * Closed icon vocabulary for admin-editable content (About Us mission
 * pillars and achievements).
 *
 * Deliberately a small, fixed set rather than free text: the dashboard offers
 * a <select> of these keys, and the API validates against the same list
 * (see `missionPillarSchema`/`achievementSchema` in lib/validation.ts). This
 * keeps the AboutPage.missionPillars/achievements JSON columns bounded and
 * safe instead of becoming an arbitrary content-builder.
 */

import {
  Award,
  BadgeCheck,
  BookOpen,
  Ear,
  Eye,
  Flag,
  Medal,
  Mic,
  Rocket,
  Star,
  Target,
  Trophy,
  type LucideIcon,
} from "lucide-react";

export const ICON_OPTIONS = {
  eye: Eye,
  ear: Ear,
  mic: Mic,
  trophy: Trophy,
  medal: Medal,
  award: Award,
  star: Star,
  flag: Flag,
  target: Target,
  "badge-check": BadgeCheck,
  rocket: Rocket,
  book: BookOpen,
} as const satisfies Record<string, LucideIcon>;

export const ICON_KEYS = Object.keys(ICON_OPTIONS) as [
  keyof typeof ICON_OPTIONS,
  ...(keyof typeof ICON_OPTIONS)[],
];

export type IconKey = keyof typeof ICON_OPTIONS;

/** Falls back to a generic icon if a stored key is ever somehow unknown. */
export function resolveIcon(key: string): LucideIcon {
  return (ICON_OPTIONS as Record<string, LucideIcon>)[key] ?? Star;
}

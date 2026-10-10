/**
 * Site-wide settings. SERVER ONLY.
 *
 * Backed by a single row (id = "main"), admin-editable from the dashboard.
 */

import { cache } from "react";
import { prisma } from "@/server/db";
import type { WebsiteSettings } from "@/types/domain";
import { DEFAULT_SETTINGS } from "@/lib/seed-data";
import { toSettings } from "./_mappers";

/**
 * Falls back to DEFAULT_SETTINGS when the row is missing, so a fresh database
 * (or one seeded out of order) renders the public site rather than crashing.
 *
 * Wrapped in React's cache() — per-request memoization, not a cross-request
 * cache — for the same reason server/auth.ts's getCurrentUser() is: the
 * public layout, several pages, and generateMetadata all call this within
 * one request, and without this it queried `website_settings` 2-3x per
 * request (measured live in the 2026 pre-deployment audit). A later request
 * always gets a fresh call, so a Settings save is visible immediately —
 * confirmed no code path re-reads getSettings() after updateSettings()
 * within the same request (the PATCH route returns updateSettings()'s own
 * result directly), so there's no risk of this serving a stale value to a
 * write it should reflect.
 */
export const getSettings = cache(async (): Promise<WebsiteSettings> => {
  const row = await prisma.websiteSettings.findUnique({ where: { id: "main" } });
  return row ? toSettings(row) : DEFAULT_SETTINGS;
});

export async function updateSettings(
  input: Partial<WebsiteSettings>
): Promise<WebsiteSettings> {
  // Only copy keys that were actually supplied — a PATCH with two fields
  // must not blank the other eleven.
  const data: Record<string, string | null> = {};
  const assignable: (keyof WebsiteSettings)[] = [
    "siteName", "tagline", "logoUrl", "heroHeadline", "heroSubheadline",
    "announcement", "organizationName", "organizationDescription",
    "contactEmail", "socialFacebook", "socialX", "socialInstagram",
    "socialYoutube", "footerText", "academicYear",
  ];

  for (const key of assignable) {
    if (input[key] !== undefined) data[key] = input[key] as string | null;
  }

  const row = await prisma.websiteSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...DEFAULT_SETTINGS, ...data },
    update: data,
  });

  return toSettings(row);
}

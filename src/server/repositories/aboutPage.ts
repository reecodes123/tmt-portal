/**
 * About Us page content. SERVER ONLY.
 *
 * Backed by a single row (id = "main"), admin-editable from the dashboard —
 * same singleton pattern as WebsiteSettings. Structured only where the
 * public page is a genuine repeating list (mission pillars, achievements);
 * the narrative body is one rich-text field.
 */

import { prisma } from "@/server/db";
import type { AboutPage } from "@/types/domain";
import type { UpdateAboutPageBody } from "@/types/api";
import { DEFAULT_ABOUT_PAGE } from "@/lib/seed-data";
import { sanitizeRichText } from "@/server/sanitize";
import { toAboutPage } from "./_mappers";
import type { Prisma } from "@prisma/client";

/**
 * Falls back to DEFAULT_ABOUT_PAGE when the row is missing, so a fresh or
 * out-of-order-seeded database still renders the page instead of crashing —
 * same resilience pattern as settings.ts:getSettings().
 */
export async function getAboutPage(): Promise<AboutPage> {
  const row = await prisma.aboutPage.findUnique({ where: { id: "main" } });
  return row ? toAboutPage(row) : DEFAULT_ABOUT_PAGE;
}

/** Plain-value shape for a write — deliberately not Prisma's generated
 * update-input type, which also permits `{ set: ... }` operation wrappers
 * that don't belong in a `create` spread. */
interface AboutPageWrite {
  heroEyebrow?: string | null;
  heroTitle?: string;
  heroSubtitle?: string | null;
  heroImageUrl?: string | null;
  overview?: string;
  missionPillars?: Prisma.InputJsonValue;
  achievements?: Prisma.InputJsonValue;
}

export async function updateAboutPage(
  input: UpdateAboutPageBody
): Promise<AboutPage> {
  // Only copy keys that were actually supplied — a PATCH with one field must
  // not blank the rest of the page.
  const data: AboutPageWrite = {};
  if (input.heroEyebrow !== undefined) data.heroEyebrow = input.heroEyebrow;
  if (input.heroTitle !== undefined) data.heroTitle = input.heroTitle;
  if (input.heroSubtitle !== undefined) data.heroSubtitle = input.heroSubtitle;
  if (input.heroImageUrl !== undefined) data.heroImageUrl = input.heroImageUrl;
  if (input.overview !== undefined) data.overview = sanitizeRichText(input.overview);
  if (input.missionPillars !== undefined)
    data.missionPillars = input.missionPillars as unknown as Prisma.InputJsonValue;
  if (input.achievements !== undefined)
    data.achievements = input.achievements as unknown as Prisma.InputJsonValue;

  const row = await prisma.aboutPage.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      heroEyebrow: DEFAULT_ABOUT_PAGE.heroEyebrow,
      heroTitle: DEFAULT_ABOUT_PAGE.heroTitle,
      heroSubtitle: DEFAULT_ABOUT_PAGE.heroSubtitle,
      heroImageUrl: DEFAULT_ABOUT_PAGE.heroImageUrl,
      overview: DEFAULT_ABOUT_PAGE.overview,
      missionPillars: DEFAULT_ABOUT_PAGE.missionPillars as unknown as Prisma.InputJsonValue,
      achievements: DEFAULT_ABOUT_PAGE.achievements as unknown as Prisma.InputJsonValue,
      ...data,
    },
    update: data,
  });

  return toAboutPage(row);
}

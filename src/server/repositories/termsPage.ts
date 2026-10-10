/**
 * Terms & Conditions content. SERVER ONLY.
 *
 * Backed by a single row (id = "main"), admin-editable from the dashboard.
 * `version` only advances when an update is explicitly marked "substantial"
 * (bumpVersion: true) — that's what drives re-acceptance prompts for both
 * anonymous visitors (localStorage) and staff (User.termsAcceptedVersion).
 */

import { prisma } from "@/server/db";
import type { TermsPage } from "@/types/domain";
import type { UpdateTermsPageBody } from "@/types/api";
import { DEFAULT_TERMS_PAGE } from "@/lib/seed-data";
import { sanitizeRichText } from "@/server/sanitize";
import { toTermsPage } from "./_mappers";

/**
 * Falls back to DEFAULT_TERMS_PAGE when the row is missing, so a fresh or
 * out-of-order-seeded database still renders /terms instead of crashing.
 */
export async function getTermsPage(): Promise<TermsPage> {
  const row = await prisma.termsPage.findUnique({ where: { id: "main" } });
  return row ? toTermsPage(row) : DEFAULT_TERMS_PAGE;
}

export async function updateTermsPage(
  input: UpdateTermsPageBody
): Promise<TermsPage> {
  const existing = await prisma.termsPage.findUnique({ where: { id: "main" } });
  const nextVersion = input.bumpVersion
    ? (existing?.version ?? DEFAULT_TERMS_PAGE.version) + 1
    : undefined;

  const sanitizedContent =
    input.content !== undefined ? sanitizeRichText(input.content) : undefined;

  const row = await prisma.termsPage.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      content: sanitizedContent ?? DEFAULT_TERMS_PAGE.content,
      version: nextVersion ?? DEFAULT_TERMS_PAGE.version,
    },
    update: {
      ...(sanitizedContent !== undefined ? { content: sanitizedContent } : {}),
      ...(nextVersion !== undefined ? { version: nextVersion } : {}),
    },
  });

  return toTermsPage(row);
}

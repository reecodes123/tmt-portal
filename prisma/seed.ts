/**
 * Database seeder — `npm run db:seed`
 *
 * Idempotent: every write is an upsert keyed on a natural unique column, so
 * running this repeatedly is safe and won't duplicate rows.
 *
 * Seeds, in dependency order:
 *   1. Website settings (single row, id = "main")
 *   2. Categories       (needed before articles — FK)
 *   3. Admin + Editor accounts (needed before articles — FK)
 *   4. Editorial board members
 *   5. Sample articles  (depends on 2 + 3)
 *
 * Credentials come from env so real passwords never live in source control.
 * See .env.example for the four SEED_* variables.
 */

import { PrismaClient, type BoardTier, type ArticleStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import {
  SEED_ARTICLES,
  SEED_BOARD_MEMBERS,
  SEED_CATEGORIES,
  SEED_POSITIONS,
  DEFAULT_ABOUT_PAGE,
  DEFAULT_SETTINGS,
  DEFAULT_TERMS_PAGE,
} from "../src/lib/seed-data";
import type { Prisma } from "@prisma/client";

const prisma = new PrismaClient();

/** bcrypt work factor. 12 is the current sensible default. */
const BCRYPT_ROUNDS = 12;

/**
 * The domain layer writes tiers hyphenated ("editor-in-chief") because that's
 * what reads well in URLs and UI. Prisma enum members can't contain hyphens,
 * so the DB stores them underscored. This is the single conversion point.
 */
function toDbTier(tier: string): BoardTier {
  return tier.replace(/-/g, "_") as BoardTier;
}

function requireEnv(name: string, fallback?: string): string {
  const value = process.env[name] ?? fallback;
  if (!value) {
    throw new Error(
      `Missing required env var ${name}. Copy .env.example to .env and fill it in.`
    );
  }
  return value;
}

async function seedSettings() {
  // `logoUrl` is nullable in the schema but absent from DEFAULT_SETTINGS,
  // so it's supplied explicitly rather than relying on the spread.
  const data = {
    siteName: DEFAULT_SETTINGS.siteName,
    tagline: DEFAULT_SETTINGS.tagline,
    logoUrl: DEFAULT_SETTINGS.logoUrl ?? "/images/logo.png",
    heroHeadline: DEFAULT_SETTINGS.heroHeadline,
    heroSubheadline: DEFAULT_SETTINGS.heroSubheadline,
    announcement: DEFAULT_SETTINGS.announcement ?? null,
    organizationName: DEFAULT_SETTINGS.organizationName,
    organizationDescription: DEFAULT_SETTINGS.organizationDescription,
    contactEmail: DEFAULT_SETTINGS.contactEmail,
    socialFacebook: DEFAULT_SETTINGS.socialFacebook,
    socialX: DEFAULT_SETTINGS.socialX,
    socialInstagram: DEFAULT_SETTINGS.socialInstagram,
    socialYoutube: DEFAULT_SETTINGS.socialYoutube,
    footerText: DEFAULT_SETTINGS.footerText,
    academicYear: DEFAULT_SETTINGS.academicYear,
  };

  await prisma.websiteSettings.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });

  console.log("  ✓ Website settings");
}

async function seedCategories() {
  for (const [index, category] of SEED_CATEGORIES.entries()) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description ?? null,
        sortOrder: index,
      },
      update: {
        name: category.name,
        description: category.description ?? null,
        sortOrder: index,
      },
    });
  }

  console.log(`  ✓ Categories (${SEED_CATEGORIES.length})`);
}

async function seedUsers() {
  const adminEmail = requireEnv("SEED_ADMIN_EMAIL", "eic@marsu.edu.ph");
  const adminPassword = requireEnv("SEED_ADMIN_PASSWORD");
  const editorEmail = requireEnv("SEED_EDITOR_EMAIL", "editor@marsu.edu.ph");
  const editorPassword = requireEnv("SEED_EDITOR_PASSWORD");

  // Hash on every run so rotating the env password actually takes effect.
  const [adminHash, editorHash] = await Promise.all([
    bcrypt.hash(adminPassword, BCRYPT_ROUNDS),
    bcrypt.hash(editorPassword, BCRYPT_ROUNDS),
  ]);

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      displayName: "Thea Eisabella R. Pondevida",
      passwordHash: adminHash,
      role: "admin",
      active: true,
    },
    update: { passwordHash: adminHash, role: "admin", active: true },
  });

  const editor = await prisma.user.upsert({
    where: { email: editorEmail },
    create: {
      email: editorEmail,
      displayName: "Mark Jerehm A. Abling",
      passwordHash: editorHash,
      role: "editor",
      active: true,
    },
    update: { passwordHash: editorHash, role: "editor", active: true },
  });

  console.log(`  ✓ Admin account   → ${admin.email}`);
  console.log(`  ✓ Editor account  → ${editor.email}`);

  return { admin, editor };
}

async function seedAboutPage() {
  const data = {
    heroEyebrow: DEFAULT_ABOUT_PAGE.heroEyebrow ?? null,
    heroTitle: DEFAULT_ABOUT_PAGE.heroTitle,
    heroSubtitle: DEFAULT_ABOUT_PAGE.heroSubtitle ?? null,
    heroImageUrl: DEFAULT_ABOUT_PAGE.heroImageUrl ?? null,
    overview: DEFAULT_ABOUT_PAGE.overview,
    missionPillars: DEFAULT_ABOUT_PAGE.missionPillars as unknown as Prisma.InputJsonValue,
    achievements: DEFAULT_ABOUT_PAGE.achievements as unknown as Prisma.InputJsonValue,
  };

  await prisma.aboutPage.upsert({
    where: { id: "main" },
    create: { id: "main", ...data },
    update: data,
  });

  console.log("  ✓ About Us page");
}

async function seedTermsPage() {
  await prisma.termsPage.upsert({
    where: { id: "main" },
    create: {
      id: "main",
      content: DEFAULT_TERMS_PAGE.content,
      version: DEFAULT_TERMS_PAGE.version,
    },
    // Never overwrite `version` on reseed — an admin may have already bumped
    // it in production, and a reseed shouldn't silently roll that back.
    update: { content: DEFAULT_TERMS_PAGE.content },
  });

  console.log("  ✓ Terms & Conditions page");
}

/**
 * Grandfathers every account that has never explicitly accepted Terms onto
 * whatever version is live right now. Without this, deploying the
 * re-acceptance gate would lock every existing staff member out of the
 * dashboard simultaneously — the gate should only ever fire on a genuinely
 * *new* version going forward, not retroactively for content that predates
 * the feature.
 */
async function backfillTermsAcceptance() {
  const terms = await prisma.termsPage.findUnique({ where: { id: "main" } });
  const version = terms?.version ?? DEFAULT_TERMS_PAGE.version;

  const { count } = await prisma.user.updateMany({
    where: { termsAcceptedVersion: null },
    data: { termsAcceptedVersion: version },
  });

  if (count > 0) {
    console.log(`  ✓ Grandfathered ${count} account(s) onto Terms v${version}`);
  }
}

/** Must run before seedBoardMembers — members are linked by position name. */
async function seedPositions() {
  for (const position of SEED_POSITIONS) {
    const data = { tier: toDbTier(position.tier), sortOrder: position.sortOrder };
    await prisma.position.upsert({
      where: { name: position.name },
      create: { name: position.name, ...data },
      update: data,
    });
  }

  console.log(`  ✓ Editorial positions (${SEED_POSITIONS.length})`);
}

async function seedBoardMembers() {
  const positions = await prisma.position.findMany({ select: { id: true, name: true } });
  const positionIdByName = new Map(positions.map((p) => [p.name, p.id]));

  for (const member of SEED_BOARD_MEMBERS) {
    const positionId = positionIdByName.get(member.positionName);
    if (!positionId) {
      console.warn(`  ! Skipping "${member.name}" — no position named "${member.positionName}"`);
      continue;
    }

    const data = {
      name: member.name,
      positionId,
      sortOrder: member.sortOrder,
    };

    await prisma.boardMember.upsert({
      where: { id: member.id },
      create: { id: member.id, ...data },
      update: data,
    });
  }

  console.log(`  ✓ Editorial board members (${SEED_BOARD_MEMBERS.length})`);
}

async function seedArticles(authorIds: { adminId: string; editorId: string }) {
  // Look up category ids once instead of querying inside the loop.
  const categories = await prisma.category.findMany({
    select: { id: true, slug: true },
  });
  const categoryIdBySlug = new Map(categories.map((c) => [c.slug, c.id]));

  let created = 0;
  let skipped = 0;

  for (const [index, article] of SEED_ARTICLES.entries()) {
    const categoryId = categoryIdBySlug.get(article.categorySlug);

    if (!categoryId) {
      console.warn(
        `  ! Skipping "${article.slug}" — no category "${article.categorySlug}"`
      );
      skipped += 1;
      continue;
    }

    // Alternate authorship so the editor owns some articles. This matters for
    // testing permissions: `canEditArticle` lets editors touch only their own,
    // and that rule is unverifiable if one account owns everything.
    const authorId = index % 2 === 0 ? authorIds.adminId : authorIds.editorId;

    const data = {
      title: article.title,
      subheadline: article.subheadline ?? null,
      excerpt: article.excerpt,
      content: article.content,
      coverImageUrl: article.coverImageUrl,
      articleBy: article.articleBy,
      contentImageUrls: article.contentImageUrls ?? [],
      featured: article.featured,
      status: article.status as ArticleStatus,
      publishedAt: article.publishedAt ? new Date(article.publishedAt) : null,
      categoryId,
      authorId,
    };

    await prisma.article.upsert({
      where: { slug: article.slug },
      create: { slug: article.slug, ...data },
      update: data,
    });

    created += 1;
  }

  console.log(
    `  ✓ Articles (${created} seeded${skipped ? `, ${skipped} skipped` : ""})`
  );
}

async function main() {
  console.log("\nSeeding The Matrix Today database…\n");

  await seedSettings();
  await seedCategories();
  const { admin, editor } = await seedUsers();
  await seedAboutPage();
  await seedTermsPage();
  await backfillTermsAcceptance();
  await seedPositions();
  await seedBoardMembers();
  await seedArticles({ adminId: admin.id, editorId: editor.id });

  console.log("\nDone. Sign in at /login with:");
  console.log(`  Administrator  ${admin.email}`);
  console.log(`  Editor         ${editor.email}`);
  console.log("  (passwords are the SEED_*_PASSWORD values from your .env)\n");
}

main()
  .then(async () => {
    await prisma.$disconnect();
    process.exit(0);
  })
  .catch(async (error) => {
    console.error("\nSeed failed:\n", error);
    await prisma.$disconnect();
    process.exit(1);
  });

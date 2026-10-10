/**
 * Seed / fallback data.
 *
 * Ported from the prototype's `src/app/data/articles.ts` and the hardcoded
 * defaults that used to live inside the Firebase service files.
 *
 * Purpose: the public site renders meaningful content before the MySQL
 * database exists, so the frontend can be built and reviewed independently of
 * the backend. Repositories return this until Prisma queries replace them.
 *
 * This file is ALSO the source for `prisma/seed.ts` once the DB is live.
 */

import type {
  AboutPage,
  Article,
  BoardTier,
  Category,
  TermsPage,
  WebsiteSettings,
} from "@/types/domain";

/**
 * `description` is shown as the subtitle on each category's public listing
 * page (/[category]) — transcribed from what used to be hardcoded per-page
 * copy in six near-identical route files, so nothing visually regresses now
 * that a single dynamic route reads it from here instead.
 */
export const SEED_CATEGORIES: Category[] = [
  {
    id: "c1",
    name: "News",
    slug: "news",
    description:
      "Stay updated with the latest happenings, breakthroughs, and developments from the MarSU College of Engineering community.",
  },
  {
    id: "c2",
    name: "Features",
    slug: "features",
    description:
      "In-depth stories showcasing the people, projects, and innovations that define our engineering excellence.",
  },
  {
    id: "c3",
    name: "Editorials",
    slug: "editorials",
    description:
      "Thoughtful perspectives and critical analysis on issues affecting the engineering community and beyond.",
  },
  {
    id: "c4",
    name: "Literary",
    slug: "literary",
    description:
      "Creative expressions from our engineering minds — poetry, prose, and artistic reflections on the technical world.",
  },
  {
    id: "c5",
    name: "Sports",
    slug: "sports",
    description:
      "Celebrating athletic achievements and team spirit within the MarSU College of Engineering community.",
  },
  {
    id: "c6",
    name: "Announcements",
    slug: "announcements",
    description:
      "Important updates, deadlines, and opportunities for the MarSU College of Engineering community.",
  },
];

export const SEED_ARTICLES: Article[] = [
  {
    id: "1",
    slug: "marsu-engineering-students-win-national-robotics-competition",
    title: "MarSU Engineering Students Win National Robotics Competition",
    excerpt: "Team from Marinduque State University takes first place in prestigious nationwide innovation challenge.",
    content:
      "<p>Students from the Marinduque State University College of Engineering have achieved a remarkable victory at the National Robotics Competition...</p>",
    categorySlug: "news",
    categoryName: "News",
    authorId: "seed-author",
    authorName: "Maria Santos",
    articleBy: "Maria Santos",
    coverImageUrl:
      "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: true,
    status: "published",
    publishedAt: "2026-02-03T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-02-03T08:00:00.000Z",
    updatedAt: "2026-02-03T08:00:00.000Z",
  },
  {
    id: "2",
    slug: "new-ai-research-lab-opens-at-marsu-college-of-engineering",
    title: "New AI Research Lab Opens at MarSU College of Engineering",
    excerpt: "State-of-the-art facility to support groundbreaking research in artificial intelligence and machine learning.",
    content:
      "<p>The Marinduque State University has inaugurated a cutting-edge Artificial Intelligence Research Laboratory...</p>",
    categorySlug: "news",
    categoryName: "News",
    authorId: "seed-author",
    authorName: "John Dela Cruz",
    articleBy: "John Dela Cruz",
    coverImageUrl:
      "https://images.unsplash.com/photo-1581094016071-4715e9a1ae93?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: true,
    status: "published",
    publishedAt: "2026-02-02T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-02-02T08:00:00.000Z",
    updatedAt: "2026-02-02T08:00:00.000Z",
  },
  {
    id: "3",
    slug: "behind-the-blueprint-a-day-in-the-life-of-civil-engineering-students",
    title: "Behind the Blueprint: A Day in the Life of Civil Engineering Students",
    excerpt: "An intimate look at the challenges and triumphs of students shaping the future of infrastructure.",
    content:
      "<p>From dawn studio sessions to late-night project collaborations, civil engineering students at MarSU navigate a demanding yet rewarding academic journey...</p>",
    categorySlug: "features",
    categoryName: "Features",
    authorId: "seed-author",
    authorName: "Angela Rodriguez",
    articleBy: "Angela Rodriguez",
    coverImageUrl:
      "https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: true,
    status: "published",
    publishedAt: "2026-02-01T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-02-01T08:00:00.000Z",
    updatedAt: "2026-02-01T08:00:00.000Z",
  },
  {
    id: "4",
    slug: "the-ethics-of-innovation-balancing-progress-and-responsibility",
    title: "The Ethics of Innovation: Balancing Progress and Responsibility",
    excerpt: "As technology advances, engineering students must consider the broader implications of their work.",
    content:
      "<p>In an era of rapid technological advancement, the role of engineers extends beyond technical expertise...</p>",
    categorySlug: "editorials",
    categoryName: "Editorials",
    authorId: "seed-author",
    authorName: "Prof. Ricardo Lim",
    articleBy: "Prof. Ricardo Lim",
    coverImageUrl:
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: false,
    status: "published",
    publishedAt: "2026-01-31T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-01-31T08:00:00.000Z",
    updatedAt: "2026-01-31T08:00:00.000Z",
  },
  {
    id: "5",
    slug: "marsu-engineers-dominate-regional-sports-fest",
    title: "MarSU Engineers Dominate Regional Sports Fest",
    excerpt: "College of Engineering teams bring home multiple medals in basketball, volleyball, and track events.",
    content:
      "<p>The MarSU College of Engineering demonstrated excellence both in academics and athletics...</p>",
    categorySlug: "sports",
    categoryName: "Sports",
    authorId: "seed-author",
    authorName: "Miguel Torres",
    articleBy: "Miguel Torres",
    coverImageUrl:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: false,
    status: "published",
    publishedAt: "2026-01-30T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-01-30T08:00:00.000Z",
    updatedAt: "2026-01-30T08:00:00.000Z",
  },
  {
    id: "6",
    slug: "code-and-poetry-when-engineering-meets-art",
    title: "Code and Poetry: When Engineering Meets Art",
    excerpt: "A collection of poems and reflections from engineering students finding beauty in algorithms.",
    content:
      "<p>In the intersection of logic and creativity, MarSU engineering students explore the poetic side of their discipline...</p>",
    categorySlug: "literary",
    categoryName: "Literary",
    authorId: "seed-author",
    authorName: "Sofia Reyes",
    articleBy: "Sofia Reyes",
    coverImageUrl:
      "https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: false,
    status: "published",
    publishedAt: "2026-01-29T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-01-29T08:00:00.000Z",
    updatedAt: "2026-01-29T08:00:00.000Z",
  },
  {
    id: "7",
    slug: "registration-for-summer-internship-program-now-open",
    title: "Registration for Summer Internship Program Now Open",
    excerpt: "Applications accepted until March 1st for industry partnerships with leading tech companies.",
    content:
      "<p>The College of Engineering announces the opening of applications for the 2026 Summer Internship Program...</p>",
    categorySlug: "announcements",
    categoryName: "Announcements",
    authorId: "seed-author",
    authorName: "Dean\u2019s Office",
    articleBy: "Dean\u2019s Office",
    coverImageUrl:
      "https://images.unsplash.com/photo-1524178232363-1fb2b075b655?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: false,
    status: "published",
    publishedAt: "2026-02-04T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-02-04T08:00:00.000Z",
    updatedAt: "2026-02-04T08:00:00.000Z",
  },
  {
    id: "8",
    slug: "sustainable-engineering-green-solutions-for-tomorrow",
    title: "Sustainable Engineering: Green Solutions for Tomorrow",
    excerpt: "MarSU researchers develop eco-friendly materials for construction and manufacturing.",
    content:
      "<p>In response to growing environmental concerns, the research team at MarSU has pioneered sustainable engineering solutions...</p>",
    categorySlug: "news",
    categoryName: "News",
    authorId: "seed-author",
    authorName: "Dr. Elena Cruz",
    articleBy: "Dr. Elena Cruz",
    coverImageUrl:
      "https://images.unsplash.com/photo-1466611653911-95081537e5b7?auto=format&fit=crop&w=1080&q=80",
    contentImageUrls: [],
    featured: false,
    status: "published",
    publishedAt: "2026-01-28T08:00:00.000Z",
    views: 0,
    likes: 0,
    bookmarks: 0,
    createdAt: "2026-01-28T08:00:00.000Z",
    updatedAt: "2026-01-28T08:00:00.000Z",
  },
];

/**
 * The admin-manageable Position catalog (Dashboard → Positions). Seeded
 * before board members, which reference a position by name below — resolved
 * to a real positionId by prisma/seed.ts, the one place that translation
 * happens.
 *
 * Hierarchy: adviser (top) → editor-in-chief → editorial-leadership
 * (Associate + Managing Editor, same level so they render side-by-side) →
 * section-editor → assistant-editor → the seven staff writing/creative
 * roles → creatives/media/broadcast (leadership + generic staff share a
 * tier) → technical → consultant (Publication Consultant, very bottom).
 */
export const SEED_POSITIONS: { name: string; tier: BoardTier; sortOrder: number }[] = [
  { name: "Newsletter Adviser", tier: "adviser", sortOrder: 0 },
  { name: "Editor-in-Chief", tier: "editor-in-chief", sortOrder: 0 },
  { name: "Associate Editor", tier: "editorial-leadership", sortOrder: 0 },
  { name: "Managing Editor", tier: "editorial-leadership", sortOrder: 1 },
  { name: "News Editor", tier: "section-editor", sortOrder: 0 },
  { name: "Feature Editor", tier: "section-editor", sortOrder: 1 },
  { name: "Literary Editor", tier: "section-editor", sortOrder: 2 },
  { name: "Sports Editor", tier: "section-editor", sortOrder: 3 },
  { name: "Editorial Editor", tier: "section-editor", sortOrder: 4 },
  { name: "Assistant News Editor", tier: "assistant-editor", sortOrder: 0 },
  { name: "Assistant Sports Editor", tier: "assistant-editor", sortOrder: 1 },
  { name: "Social Media Manager", tier: "assistant-editor", sortOrder: 2 },
  { name: "Assistant Social Media Manager", tier: "assistant-editor", sortOrder: 3 },
  { name: "News Writer", tier: "news-writer", sortOrder: 0 },
  { name: "Feature Writer", tier: "feature-writer", sortOrder: 0 },
  { name: "Sports Writer", tier: "sports-writer", sortOrder: 0 },
  { name: "Literary Writer", tier: "literary-writer", sortOrder: 0 },
  { name: "Copyreader", tier: "copyreader", sortOrder: 0 },
  { name: "Cartoonist", tier: "cartoonist", sortOrder: 0 },
  { name: "Photojournalist", tier: "photojournalist", sortOrder: 0 },
  { name: "Creatives Director", tier: "creatives", sortOrder: 0 },
  { name: "Assistant Creatives Director", tier: "creatives", sortOrder: 1 },
  { name: "Lead Cartoonist", tier: "creatives", sortOrder: 2 },
  { name: "Creatives", tier: "creatives", sortOrder: 3 },
  { name: "Media Director", tier: "media", sortOrder: 0 },
  { name: "Assistant Media Director", tier: "media", sortOrder: 1 },
  { name: "Lead Photojournalist", tier: "media", sortOrder: 2 },
  { name: "Assistant Lead Photojournalist", tier: "media", sortOrder: 3 },
  { name: "Media Editor", tier: "media", sortOrder: 4 },
  { name: "Head Broadcaster", tier: "broadcast", sortOrder: 0 },
  { name: "Broadcaster", tier: "broadcast", sortOrder: 1 },
  { name: "Technical Consultant", tier: "technical", sortOrder: 0 },
  { name: "Assistant Technical Consultant", tier: "technical", sortOrder: 1 },
  { name: "Publication Consultant", tier: "consultant", sortOrder: 0 },
];

/**
 * Seed-only shape: `positionName` is resolved to a real `positionId` by
 * prisma/seed.ts after SEED_POSITIONS is seeded, so this can't reuse the
 * domain BoardMember type (which requires an already-real positionId).
 */
export const SEED_BOARD_MEMBERS: {
  id: string;
  name: string;
  positionName: string;
  sortOrder: number;
}[] = [
  { id: "b1", name: "Yza S. Casimero", positionName: "Publication Consultant", sortOrder: 0 },
  { id: "b2", name: "Thea Eisabella R. Pondevida", positionName: "Editor-in-Chief", sortOrder: 0 },
  { id: "b3", name: "Karel Alexis D. De Castro", positionName: "Associate Editor", sortOrder: 0 },
  { id: "b4", name: "Angel Catherine S. Candelaria", positionName: "Managing Editor", sortOrder: 0 },
  { id: "b5", name: "Mark Jerehm A. Abling", positionName: "News Editor", sortOrder: 0 },
  { id: "b6", name: "Maria Ericca C. Monterey", positionName: "Feature Editor", sortOrder: 1 },
  { id: "b7", name: "Marijune M. Francis", positionName: "Literary Editor", sortOrder: 2 },
  { id: "b8", name: "Tyrish Ara Joy Q. Pelobello", positionName: "Sports Editor", sortOrder: 3 },
  { id: "b9", name: "Kayley Anne S. Guevara", positionName: "Editorial Editor", sortOrder: 4 },
  { id: "b10", name: "Mark Levi A. Roldan", positionName: "Assistant News Editor", sortOrder: 0 },
  { id: "b11", name: "Harlene Joyce P. Rey", positionName: "Assistant Sports Editor", sortOrder: 1 },
  { id: "b12", name: "Chrisha Daine R. Red", positionName: "Social Media Manager", sortOrder: 2 },
  { id: "b13", name: "Alexandra J. Lope", positionName: "Assistant Social Media Manager", sortOrder: 3 },
  { id: "b14", name: "Darlene Kate P. Principe", positionName: "Creatives Director", sortOrder: 0 },
  { id: "b15", name: "Johnaleen L. Labao", positionName: "Assistant Creatives Director", sortOrder: 1 },
  { id: "b16", name: "Elthon John R. Tagbago", positionName: "Lead Cartoonist", sortOrder: 2 },
  { id: "b17", name: "Rai Laurence M. Mabolo", positionName: "Media Director", sortOrder: 0 },
  { id: "b18", name: "Van Jefferson M. Malacas", positionName: "Assistant Media Director", sortOrder: 1 },
  { id: "b19", name: "Mary Kate Ashley D. Malapad", positionName: "Lead Photojournalist", sortOrder: 2 },
  { id: "b20", name: "Kean Xenia P. Neri", positionName: "Assistant Lead Photojournalist", sortOrder: 3 },
  { id: "b21", name: "Clyde Drexler M. Lanot", positionName: "Head Broadcaster", sortOrder: 0 },
  { id: "b22", name: "Ana Samantha R. Pielago", positionName: "Technical Consultant", sortOrder: 0 },
  { id: "b23", name: "Ronnel P. Espinosa", positionName: "Assistant Technical Consultant", sortOrder: 1 },
];

/**
 * Transcribed from the previously-hardcoded About Us page (AboutContent.tsx)
 * so the DB-backed page renders visually identical content on first deploy.
 * Also the fallback aboutPage.ts returns if the row is ever missing.
 */
export const DEFAULT_ABOUT_PAGE: AboutPage = {
  heroEyebrow: "Organization Profile",
  heroTitle: "The Matrix Today",
  heroSubtitle:
    "The official student publication of Marinduque State University — College of Engineering.",
  heroImageUrl: "/images/team-photo.png",
  overview:
    "<p>Through the efforts of the Engineering Student Organization and the Faculty of the College of Engineering, the organization was reestablished in 2023 after years of hiatus due to the pandemic.</p>" +
    "<p>The publication envisions itself as the eyes, ears, and voice of the students of CEng through true and reliable journalism.</p>" +
    "<p>Today, with the efforts of the Editorial Board and Staff, The Matrix Today successfully covered the recent Student’s Week 2023 through its online platform, releasing real-time updates about the activities.</p>" +
    "<p>The organization continues to participate in journalism competitions while continuously improving its craft and upholding journalistic excellence. Above all, The Matrix Today remains committed to publishing relevant news and stories centered on the College of Engineering.</p>" +
    "<p>The Editorial Board continues the legacy established by its predecessors, serving as the voice of the students. The Matrix Today aims to amplify the voices of the university community so they may be heard across the campus and beyond.</p>",
  missionPillars: [
    { icon: "eye", label: "The Eyes", description: "Witnessing and documenting campus life with integrity." },
    { icon: "ear", label: "The Ears", description: "Listening closely to the concerns of the student body." },
    { icon: "mic", label: "The Voice", description: "Amplifying student stories through reliable journalism." },
  ],
  achievements: [
    {
      year: "2023",
      icon: "trophy",
      title: "1st Place — Student Publication Contest",
      description:
        "Real-time coverage of Student's Week 2023 through the online platform earned the organization first place.",
    },
    {
      year: "2023",
      icon: "medal",
      title: "Gold — Pagsulat ng Sanaysay Contest",
      description: "A member of the publication won gold in the essay-writing competition.",
    },
    {
      year: "2024",
      icon: "award",
      title: "2nd Place — Desktop Publishing Contest",
      description: "The Matrix Today placed second during Student's Week 2024.",
    },
  ],
  updatedAt: new Date(0).toISOString(),
};

/**
 * Transcribed from the previously-hardcoded Terms & Conditions page
 * (TermsContent.tsx), collapsed from five icon-cards into one rich-text
 * document — a Terms document reads naturally as continuous text, and this
 * keeps the model a single editable block instead of a structured list.
 * Also the fallback termsPage.ts returns if the row is ever missing.
 */
export const DEFAULT_TERMS_PAGE: TermsPage = {
  content:
    "<p>Welcome to The Matrix Today Portal. By accessing and using this website, you agree to the following terms and conditions:</p>" +
    "<h2>1. Website Purpose</h2>" +
    "<p>This website is intended to provide news, articles, announcements, and other publication materials for informational purposes.</p>" +
    "<h2>2. Content Ownership</h2>" +
    "<p>All published articles, images, logos, and other content are the property of The Matrix Today or their respective owners. Unauthorized copying, reproduction, or distribution of any content without permission is prohibited.</p>" +
    "<h2>3. User Access</h2>" +
    "<p>Users may browse, read, like, and bookmark content for personal and non-commercial use only.</p>" +
    "<h2>4. Content Accuracy</h2>" +
    "<p>We strive to ensure that all information published is accurate and up to date. However, The Matrix Today does not guarantee that all content is free from errors or omissions.</p>" +
    "<h2>5. Changes to the Website</h2>" +
    "<p>The Matrix Today reserves the right to update, modify, or remove website content and these Terms and Conditions at any time without prior notice.</p>" +
    "<p>By continuing to use The Matrix Today Portal, you acknowledge that you have read, understood, and agreed to these Terms and Conditions.</p>",
  version: 1,
  updatedAt: new Date(0).toISOString(),
};

export const DEFAULT_SETTINGS: WebsiteSettings = {
  siteName: "The Matrix Today",
  tagline: "Engineering Innovations, Journalistic Excellence",
  heroHeadline: "The Matrix Today",
  heroSubheadline:
    "Explore groundbreaking research, student innovations, and inspiring stories from our engineering community. Stay connected with the latest developments in technology and engineering excellence.",
  announcement: "",
  organizationName: "The Matrix Today",
  organizationDescription:
    "The official student publication of Marinduque State University \u2013 College of Engineering.",
  contactEmail: "thematrixtoday.msc@gmail.com",
  socialFacebook: "https://www.facebook.com/share/14W8zzcZyMi/",
  socialX: "https://x.com/thematrix_today",
  socialInstagram:
    "https://www.instagram.com/thematrix_today?igsh=MW9temFvbjV3bnV1bA==",
  socialYoutube: "https://youtube.com/@thematrixtoday-ceng?si=PmZ5Iko-ay7XVNM1",
  footerText:
    "Behind the Matrix Today is made possible by passionate individuals who work behind the scenes to inform, represent, and connect the MarSU College of Engineering through responsible and engaging storytelling.",
  academicYear: "2025–2026",
};

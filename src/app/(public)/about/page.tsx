/**
 * Rendered per request, not prerendered at build — matches every other
 * DB-backed public page's convention (see editor-in-chief/page.tsx). Relying
 * only on the (public) layout's force-dynamic wasn't enough in practice.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { AboutContent } from "@/components/public/AboutContent";
import { getAboutPage } from "@/server/repositories/aboutPage";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The official student publication of Marinduque State University — College of Engineering.",
};

export default async function AboutPage() {
  const page = await getAboutPage();
  return <AboutContent page={page} />;
}

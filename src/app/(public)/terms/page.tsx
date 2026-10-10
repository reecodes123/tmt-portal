/**
 * Rendered per request, not prerendered at build — matches every other
 * DB-backed public page's convention (see editor-in-chief/page.tsx). Relying
 * only on the (public) layout's force-dynamic wasn't enough in practice.
 */
export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { TermsContent } from "@/components/public/TermsContent";
import { getTermsPage } from "@/server/repositories/termsPage";

export const metadata: Metadata = {
  title: "Terms and Conditions",
  description:
    "Usage terms, content policy, and legal disclaimers for The Matrix Today.",
};

export default async function TermsPage() {
  const page = await getTermsPage();
  return <TermsContent page={page} />;
}

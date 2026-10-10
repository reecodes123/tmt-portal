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

import { Header } from "@/components/public/Header";
import { Navigation } from "@/components/public/Navigation";
import { Footer } from "@/components/public/Footer";
import { ScrollToTop } from "@/components/public/ScrollToTop";
import { VisitTracker } from "@/components/public/VisitTracker";
import { PrivacyNotice } from "@/components/public/PrivacyNotice";
import { TermsAcceptanceBanner } from "@/components/public/TermsAcceptanceBanner";
import { getSettings } from "@/server/repositories/settings";
import { getTermsPage } from "@/server/repositories/termsPage";
import { listCategories } from "@/server/repositories/categories";

/**
 * Public site shell.
 *
 * Everything in the (public) route group renders inside this. The parentheses
 * make it a *route group*: it organises files without adding "/public" to any
 * URL, so /news stays /news.
 *
 * Settings are fetched once here and fanned out to Header/Footer/Navigation
 * (which forwards to SettingsPanel) so branding — site name, logo, tagline,
 * social links, footer text — reflects what's saved in the dashboard instead
 * of being hardcoded per-component. getSettings() already falls back to
 * DEFAULT_SETTINGS if the row is missing, so a DB hiccup degrades gracefully
 * instead of crashing every public page.
 */
export default async function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [settings, terms, categories] = await Promise.all([
    getSettings(),
    getTermsPage(),
    listCategories(),
  ]);

  return (
    <div className="min-h-screen flex flex-col bg-tmt-cream">
      <Header settings={settings} />
      <Navigation settings={settings} categories={categories} />
      <main className="flex-1">{children}</main>
      <Footer settings={settings} />
      <ScrollToTop />
      <VisitTracker />
      <PrivacyNotice />
      <TermsAcceptanceBanner version={terms.version} />
    </div>
  );
}

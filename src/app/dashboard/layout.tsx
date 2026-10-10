import { redirect } from "next/navigation";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { TermsReacceptanceGate } from "@/components/dashboard/TermsReacceptanceGate";
import { getCurrentUser } from "@/server/auth";
import { getTermsPage } from "@/server/repositories/termsPage";
import { getTermsAcceptedVersion } from "@/server/repositories/users";

/**
 * Dashboard shell + auth guard.
 *
 * Runs on the server, so unauthenticated visitors get a 302 to /login before
 * any dashboard HTML is even generated. This is the SECOND of three auth
 * layers:
 *
 *   1. middleware.ts       — cheapest, runs at the edge on every request
 *   2. this layout          — defense in depth for the whole dashboard tree
 *   3. every mutating API   — the only one that actually matters for security
 *
 * Client-side role checks in Sidebar.tsx are UX only, never authorization.
 *
 * Until Auth.js is wired up, getCurrentUser() returns null and the dashboard
 * is unreachable — which is the correct fail-closed behaviour.
 */
export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  if (user.role !== "editor" && user.role !== "admin") {
    redirect("/");
  }

  // Staff Terms re-acceptance gate. Compares against TermsPage.version, which
  // only advances when an edit is explicitly marked "substantial" (see
  // TermsPageEditor's version-bump toggle) — a typo fix never triggers this.
  // Gated as a conditional render, not a redirect to a separate route, so
  // there's no loop to guard against. The dev-preview escape hatch (see
  // auth.ts) uses synthetic ids with no DB row, so it's exempt — nothing to
  // accept, and POST /api/terms/accept would 404 against a real user lookup.
  const isDevPreviewUser = user.id.startsWith("dev-preview-");
  // Two independent reads — previously awaited one after another, adding a
  // full extra round trip of latency to every dashboard navigation for no
  // reason (measured in the 2026 pre-deployment audit). The dev-preview
  // account has no real DB row, so it skips the second query entirely
  // rather than looking one up that can never exist.
  const [terms, acceptedVersion] = await Promise.all([
    getTermsPage(),
    isDevPreviewUser ? Promise.resolve(null) : getTermsAcceptedVersion(user.id),
  ]);
  const effectiveAcceptedVersion = isDevPreviewUser ? terms.version : acceptedVersion;
  const needsTermsAcceptance = effectiveAcceptedVersion !== terms.version;

  return (
    // flex-col below lg, flex-row at lg+: Sidebar returns a Fragment (mobile
    // header + backdrop + aside as siblings, not wrapped in one element), so
    // without an explicit column direction here those siblings laid out as
    // flex-ROW items — the mobile-only hamburger header (no width/height of
    // its own) got stretched to full viewport height by the default
    // `align-items: stretch` and sat beside the main content instead of
    // stacking above it, rendering as a permanent navy "sidebar" occupying
    // roughly half the phone screen. flex-col fixes that by stacking the
    // header above the content on mobile; lg:flex-row restores the normal
    // side-by-side desktop layout once the real <aside> becomes lg:sticky.
    <div className="min-h-screen bg-gray-100 flex flex-col lg:flex-row">
      <Sidebar role={user.role} displayName={user.displayName} />
      <div className="flex-1 min-w-0 flex flex-col">
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {needsTermsAcceptance ? (
            <TermsReacceptanceGate version={terms.version} content={terms.content} />
          ) : (
            children
          )}
        </main>
      </div>
    </div>
  );
}

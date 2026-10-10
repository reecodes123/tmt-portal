import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

/**
 * Developer route navigator.
 *
 * A single unlinked page listing every route in the app so you can click
 * through admin/editor/public/auth surfaces during local development without
 * memorising URLs.
 *
 * PRODUCTION SAFETY: this page 404s when NODE_ENV === "production", so it
 * cannot leak in a live deployment. Turn it back on locally by running
 * `npm run dev`.
 */

export const metadata: Metadata = {
  title: "Dev Navigator",
  robots: { index: false, follow: false },
};

interface Route {
  path: string;
  name: string;
  note?: string;
}

const PUBLIC_ROUTES: Route[] = [
  { path: "/",                  name: "Homepage" },
  { path: "/news",              name: "News" },
  { path: "/features",          name: "Features" },
  { path: "/editorials",        name: "Editorials" },
  { path: "/literary",          name: "Literary" },
  { path: "/sports",            name: "Sports" },
  { path: "/announcements",     name: "Announcements" },
  { path: "/articles/marsu-engineering-students-win-national-robotics-competition", name: "Article detail", note: "seed slug" },
  { path: "/bookmarks",         name: "Bookmarks" },
  { path: "/search?q=engineering", name: "Search", note: "with sample query" },
  { path: "/about",             name: "About" },
  { path: "/editor-in-chief",   name: "Editorial Board" },
  { path: "/terms",             name: "Terms" },
];

const AUTH_ROUTES: Route[] = [
  { path: "/login",             name: "Editorial Sign In", note: "Administrator / Editor" },
];

const DASHBOARD_ROUTES: Route[] = [
  { path: "/dashboard",             name: "Dashboard home" },
  { path: "/dashboard/articles",    name: "Articles" },
  { path: "/dashboard/articles/new", name: "Create article" },
  { path: "/dashboard/drafts",      name: "Drafts" },
  { path: "/dashboard/categories",  name: "Categories" },
  { path: "/dashboard/board",       name: "Editorial Board" },
  { path: "/dashboard/media",       name: "Media library" },
  { path: "/dashboard/feedback",    name: "Feedback inbox" },
  { path: "/dashboard/profile",     name: "Profile" },
  { path: "/dashboard/analytics",   name: "Analytics",     note: "admin-only" },
  { path: "/dashboard/users",       name: "Users",         note: "admin-only" },
  { path: "/dashboard/activity-logs", name: "Activity logs", note: "admin-only" },
  { path: "/dashboard/settings",    name: "Settings",      note: "admin-only" },
];

const API_ROUTES: Route[] = [
  { path: "/api/articles",          name: "GET articles" },
  { path: "/api/categories",        name: "GET categories" },
  { path: "/api/board-members",     name: "GET board members" },
  { path: "/api/settings",          name: "GET settings" },
  { path: "/api/search?q=engineering", name: "GET search" },
];

function Section({ title, routes }: { title: string; routes: Route[] }) {
  return (
    <section className="mb-10">
      <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-tmt-navy-warm/60 mb-3">
        {title}
      </h2>
      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {routes.map((r) => (
          <li key={r.path}>
            <Link
              href={r.path}
              className="block rounded-lg border border-tmt-navy-warm/10 bg-white/60 px-4 py-3 hover:border-tmt-amber/50 hover:bg-white transition-colors"
            >
              <div className="font-medium text-sm text-tmt-navy-warm">
                {r.name}
                {r.note && (
                  <span className="ml-2 text-[10px] font-normal uppercase tracking-widest text-tmt-amber-deep">
                    {r.note}
                  </span>
                )}
              </div>
              <code className="text-xs text-tmt-navy-warm/55 font-mono">{r.path}</code>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export default function DevNavigatorPage() {
  if (process.env.NODE_ENV === "production") notFound();

  return (
    <div className="min-h-screen bg-tmt-cream-warm px-4 sm:px-8 py-10 sm:py-14">
      <div className="max-w-5xl mx-auto">
        <div className="mb-10">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-tmt-amber-deep mb-2">
            Developer navigator
          </p>
          <h1 className="text-3xl sm:text-4xl font-bold text-tmt-navy-warm mb-2">
            Every route, one click away
          </h1>
          <p className="text-tmt-navy-warm/65">
            Local-only page. 404s in production. Use it while building to jump
            between the public site, auth flow, dashboard surfaces, and API
            endpoints without typing URLs.
          </p>
        </div>

        <Section title="Public site" routes={PUBLIC_ROUTES} />
        <Section title="Auth" routes={AUTH_ROUTES} />
        <Section title="Dashboard (auth required in production)" routes={DASHBOARD_ROUTES} />
        <Section title="API endpoints" routes={API_ROUTES} />
      </div>
    </div>
  );
}

/**
 * Shared route-loading skeleton for the dashboard.
 *
 * Every dashboard route segment gets its own tiny `loading.tsx` that renders
 * this — Next.js App Router only shows a segment's loading UI while THAT
 * segment's own Server Component is fetching, so a single skeleton one level
 * up would not appear when navigating between sibling routes (e.g. Articles
 * → Editorial Board): each segment needs its own file, hence one shared,
 * reusable component instead of one bespoke skeleton per page.
 *
 * Deliberately generic and small — a heading bar plus a few pulsing card
 * shapes that roughly match the "white rounded-xl shadow-md" card language
 * already used everywhere in the dashboard, not a full mock of each page's
 * specific layout. The goal is instant visual acknowledgement that the click
 * registered, not a pixel-accurate placeholder.
 */
export function DashboardSkeleton() {
  return (
    <div className="animate-pulse" aria-hidden="true">
      <div className="h-7 w-48 bg-gray-200 rounded-lg mb-6" />
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-xl shadow-md p-4 sm:p-5 h-24" />
        ))}
      </div>
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-3">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-12 bg-gray-100 rounded-lg" />
        ))}
      </div>
    </div>
  );
}

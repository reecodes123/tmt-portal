import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { AnalyticsView } from "@/components/dashboard/AnalyticsView";
import { getAnalyticsPayload, resolveRange } from "@/server/repositories/analytics";

/** Admin-only: guarded here in addition to middleware. */
export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  // Server-rendered first paint at the default range (1 month); the client
  // component re-fetches from GET /api/analytics for every range change
  // after that, so the initial load doesn't need a client-side round trip.
  const initialData = await getAnalyticsPayload(resolveRange("1m"));

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        Analytics
      </h1>
      <AnalyticsView initialData={initialData} initialPreset="1m" />
    </div>
  );
}

import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { ActivityLogTable } from "@/components/dashboard/ActivityLogTable";
import { listActivityLogs } from "@/server/repositories/activityLogs";

/** Admin-only. New in this project — neither prototype had audit logging. */
export default async function ActivityLogsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  const logs = await listActivityLogs(200);

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
          Activity Logs
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Every dashboard mutation is recorded here for accountability.
        </p>
      </div>
      <ActivityLogTable logs={logs} />
    </div>
  );
}

import type { ActivityLog } from "@/types/domain";
import { formatRelative } from "@/lib/date";

interface Props {
  logs: ActivityLog[];
}

/** Read-only audit trail view. */
export function ActivityLogTable({ logs }: Props) {
  if (logs.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
        No activity yet. Actions will appear here once the database is live.
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden">
      {/* overflow-x-auto: the table itself doesn't reflow on narrow screens
          (actor names / action codes can be long), so it scrolls horizontally
          within the card instead of forcing the whole page to scroll. */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b border-gray-200 text-gray-600">
            <tr>
              <th className="text-left p-3 font-semibold whitespace-nowrap">Actor</th>
              <th className="text-left p-3 font-semibold whitespace-nowrap">Action</th>
              <th className="text-left p-3 font-semibold hidden sm:table-cell">
                Details
              </th>
              <th className="text-left p-3 font-semibold whitespace-nowrap">When</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {logs.map((log) => (
              <tr key={log.id}>
                <td className="p-3 text-tmt-navy font-medium whitespace-nowrap">{log.actorName}</td>
                <td className="p-3">
                  <code className="text-xs bg-gray-100 px-2 py-0.5 rounded whitespace-nowrap">
                    {log.action}
                  </code>
                </td>
                <td className="p-3 text-gray-600 hidden sm:table-cell">
                  {log.summary}
                </td>
                <td className="p-3 text-gray-500 whitespace-nowrap">
                  {formatRelative(log.createdAt)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

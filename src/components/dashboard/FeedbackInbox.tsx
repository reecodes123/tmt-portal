"use client";

import { useState } from "react";
import { Archive, CheckCircle2, Trash2 } from "lucide-react";
import { deleteFeedbackItem, updateFeedbackStatus } from "@/lib/api-client";
import type { Feedback } from "@/types/domain";
import { formatDate } from "@/lib/date";

interface Props {
  initialItems: Feedback[];
}

/** Reader feedback inbox. Mark-read/archive/delete persist via PATCH/DELETE /api/feedback/[id]. */
export function FeedbackInbox({ initialItems }: Props) {
  const [items, setItems] = useState(initialItems);
  const [filter, setFilter] = useState<"all" | "unread" | "read" | "archived">(
    "all"
  );
  const [error, setError] = useState("");

  const filtered =
    filter === "all" ? items : items.filter((f) => f.status === filter);
  const unread = items.filter((f) => f.status === "unread").length;

  // Both actions below update the UI optimistically, then roll back on
  // failure — safe here because feedback status/existence carries no
  // permission, publication, or account-status weight (unlike, say, a role
  // change), so there's nothing incorrect for the UI to briefly claim.
  const setStatus = async (id: string, status: Feedback["status"]) => {
    setError("");
    const previous = items;
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, status } : f)));
    try {
      const updated = await updateFeedbackStatus(id, status);
      setItems((prev) => prev.map((f) => (f.id === id ? updated : f)));
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : "Could not update.");
    }
  };

  const remove = async (id: string) => {
    setError("");
    const previous = items;
    setItems((prev) => prev.filter((f) => f.id !== id));
    try {
      await deleteFeedbackItem(id);
    } catch (err) {
      setItems(previous);
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-5">
        {(["all", "unread", "read", "archived"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
              filter === f
                ? "bg-tmt-navy text-white"
                : "bg-white text-gray-600 hover:bg-gray-100"
            }`}
          >
            <span className="capitalize">{f}</span>
            {f === "unread" && unread > 0 && (
              <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs rounded-full bg-tmt-orange text-white">
                {unread}
              </span>
            )}
          </button>
        ))}
      </div>

      {error && (
        <p
          role="alert"
          className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4"
        >
          {error}
        </p>
      )}

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          Nothing here.
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className={`bg-white rounded-xl shadow-md p-5 border-l-4 ${
                item.status === "unread"
                  ? "border-tmt-orange"
                  : "border-transparent"
              }`}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-tmt-navy">
                    {item.name || "Anonymous"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {formatDate(item.submittedAt)}
                  </p>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.status === "unread" && (
                    <button
                      onClick={() => setStatus(item.id, "read")}
                      className="p-2 rounded text-gray-400 hover:bg-green-50 hover:text-green-600"
                      aria-label="Mark read"
                    >
                      <CheckCircle2 size={16} />
                    </button>
                  )}
                  {item.status !== "archived" && (
                    <button
                      onClick={() => setStatus(item.id, "archived")}
                      className="p-2 rounded text-gray-400 hover:bg-gray-100 hover:text-gray-700"
                      aria-label="Archive"
                    >
                      <Archive size={16} />
                    </button>
                  )}
                  <button
                    onClick={() => remove(item.id)}
                    className="p-2 rounded text-gray-400 hover:bg-red-50 hover:text-red-600"
                    aria-label="Delete"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap break-words">{item.message}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

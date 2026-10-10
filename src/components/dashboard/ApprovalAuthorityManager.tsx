"use client";

import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { updateApprovalAuthority } from "@/lib/api-client";
import type { AppUser } from "@/types/domain";

interface Props {
  /** Every account — filtered down to active editors internally, since
   * approval authority is only ever meaningful for editors. */
  initialUsers: AppUser[];
}

/**
 * Lets the EIC delegate article-approval authority to specific Editors —
 * for when the EIC is unavailable, chosen editors can approve/reject
 * articles that are pending review. Revocable at any time.
 *
 * This is a UX convenience only: the actual grant/revoke and every check of
 * it happen server-side (PATCH /api/users/[id]/approval-authority, and
 * canApproveArticles() in permissions.ts, respectively). Nothing here is
 * itself a security boundary.
 */
export function ApprovalAuthorityManager({ initialUsers }: Props) {
  const editors = initialUsers.filter(
    (u) => u.role === "editor" && u.active
  );
  const [grants, setGrants] = useState<Record<string, boolean>>(
    Object.fromEntries(editors.map((e) => [e.id, e.canApproveArticles]))
  );
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState("");

  const toggle = async (editor: AppUser) => {
    const next = !grants[editor.id];
    setError("");
    setSaving(editor.id);
    // Optimistic, with rollback — same pattern used elsewhere in the
    // dashboard (BoardManager's reorder, for instance).
    setGrants((prev) => ({ ...prev, [editor.id]: next }));
    try {
      await updateApprovalAuthority(editor.id, next);
    } catch (err) {
      setGrants((prev) => ({ ...prev, [editor.id]: !next }));
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setSaving(null);
    }
  };

  if (editors.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
        <h2 className="font-bold text-tmt-navy mb-2 flex items-center gap-2">
          <ShieldCheck size={18} className="text-tmt-orange" />
          Article Approval Authority
        </h2>
        <p className="text-sm text-gray-500">
          No active Editor accounts yet. Add one above to delegate approval
          authority.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-md p-5 sm:p-6">
      <h2 className="font-bold text-tmt-navy mb-1.5 flex items-center gap-2">
        <ShieldCheck size={18} className="text-tmt-orange" />
        Article Approval Authority
      </h2>
      <p className="text-sm text-gray-500 mb-4">
        Editors checked below may approve or request revisions on articles
        submitted for review — useful when the Editor-in-Chief is
        unavailable. As Editor-in-Chief/Admin, you can always approve
        articles regardless of this list. Unchecking an editor here takes
        effect on their very next action, without needing to sign out.
      </p>

      {error && (
        <p role="alert" className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
          {error}
        </p>
      )}

      <div className="space-y-1">
        {editors.map((editor) => (
          <label
            key={editor.id}
            className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-gray-50 cursor-pointer"
          >
            <input
              type="checkbox"
              checked={grants[editor.id] ?? false}
              onChange={() => toggle(editor)}
              disabled={saving === editor.id}
              className="w-4 h-4 rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange shrink-0"
            />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-tmt-navy truncate">
                {editor.displayName}
              </p>
              <p className="text-xs text-gray-500 truncate">{editor.email}</p>
            </div>
            {saving === editor.id && (
              <span className="text-xs text-gray-400 shrink-0">Saving…</span>
            )}
          </label>
        ))}
      </div>
    </div>
  );
}

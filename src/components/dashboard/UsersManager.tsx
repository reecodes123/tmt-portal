"use client";

import { useState, type FormEvent } from "react";
import { Ban, CheckCircle2, Loader2, ShieldCheck, Trash2, UserPlus } from "lucide-react";
import {
  createUser,
  deleteUserAccount,
  updateApprovalAuthority,
  updateUser,
} from "@/lib/api-client";
import type { AppUser } from "@/types/domain";

interface Props {
  initialUsers: AppUser[];
  /** The signed-in admin's own id — used only to disable self-deactivation
   * in the UI. This is a UX convenience, not the security boundary:
   * PATCH/DELETE /api/users/[id] independently reject self-role-change and
   * self-deactivation server-side regardless of what the client sends. */
  viewerId: string;
}

/**
 * User management. Admin-only.
 *
 * ROLE MODEL: this system only ever needs Admin/EIC accounts that already
 * exist, plus Editor accounts created here — there is no in-app path to
 * create or promote to Admin (see createUserSchema's comment; the create
 * endpoint structurally cannot accept a role). Once created, an Editor's
 * role is fixed; what an admin CAN change per editor is whether their
 * account is active and whether they hold delegated article-approval
 * authority (server/permissions.ts's canApproveArticles()) — a capability
 * distinct from role, since not every Editor needs to approve articles.
 */
export function UsersManager({ initialUsers, viewerId }: Props) {
  const [users, setUsers] = useState(initialUsers);
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [rowError, setRowError] = useState<{ id: string; message: string } | null>(null);
  const [savingApproval, setSavingApproval] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteNotice, setDeleteNotice] = useState("");

  const handleCreate = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      const created = await createUser({ email, displayName, password });
      setUsers((prev) => [...prev, created]);
      setSuccess(`Editor account created for ${displayName}.`);
      setDisplayName("");
      setEmail("");
      setPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account.");
    } finally {
      setBusy(false);
    }
  };

  const toggleActive = async (user: AppUser) => {
    setRowError(null);
    try {
      await updateUser(user.id, { active: !user.active });
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, active: !u.active } : u))
      );
    } catch (err) {
      setRowError({
        id: user.id,
        message: err instanceof Error ? err.message : "Update failed.",
      });
    }
  };

  const toggleApproval = async (user: AppUser) => {
    const next = !user.canApproveArticles;
    setRowError(null);
    setSavingApproval(user.id);
    // Optimistic, with rollback on failure.
    setUsers((prev) =>
      prev.map((u) => (u.id === user.id ? { ...u, canApproveArticles: next } : u))
    );
    try {
      await updateApprovalAuthority(user.id, next);
    } catch (err) {
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, canApproveArticles: !next } : u))
      );
      setRowError({
        id: user.id,
        message: err instanceof Error ? err.message : "Could not update approval authority.",
      });
    } finally {
      setSavingApproval(null);
    }
  };

  const handleDelete = async (user: AppUser) => {
    const confirmed = window.confirm(
      `Delete this editor account?\n\n${user.displayName} (${user.email})\n\n` +
        "This will permanently remove the account and the user will no longer " +
        "be able to log in. This cannot be undone."
    );
    if (!confirmed) return;

    setRowError(null);
    setDeleteNotice("");
    setDeletingId(user.id);
    try {
      await deleteUserAccount(user.id);
      setUsers((prev) => prev.filter((u) => u.id !== user.id));
      setDeleteNotice(`"${user.displayName}" was permanently deleted.`);
    } catch (err) {
      setRowError({
        id: user.id,
        message:
          err instanceof Error ? err.message : "Could not delete this account.",
      });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form
        onSubmit={handleCreate}
        className="lg:sticky lg:top-6 bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-4"
      >
        <div>
          <h2 className="font-bold text-tmt-navy">Add Editor</h2>
          <p className="text-xs text-gray-500 mt-1">
            New accounts are always created as Editors. Admin/EIC accounts are
            not created from this form.
          </p>
        </div>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        {success && <p className="text-sm text-green-600">{success}</p>}

        <div>
          <label htmlFor="new-name" className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Name
          </label>
          <input
            id="new-name"
            type="text"
            required
            placeholder="Full name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="new-email" className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Email
          </label>
          <input
            id="new-email"
            type="email"
            required
            placeholder="editor@marsu.edu.ph"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="new-password" className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Password
          </label>
          <input
            id="new-password"
            type="password"
            required
            placeholder="Min 10 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
          />
          <p className="text-xs text-gray-400 mt-1">
            At least 10 characters, with an uppercase letter, a lowercase letter, and a number.
          </p>
        </div>

        <button
          type="submit"
          disabled={busy}
          className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
        >
          <UserPlus size={16} /> Create Editor
        </button>
      </form>

      <div className="lg:col-span-2 space-y-3">
        {deleteNotice && (
          <p className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-lg p-3">
            {deleteNotice}
          </p>
        )}
        <div className="bg-white rounded-xl shadow-md overflow-hidden">
        {users.length === 0 ? (
          <p className="p-6 text-gray-500">
            No accounts yet. Data will appear once the database is live.
          </p>
        ) : (
          <div className="divide-y divide-gray-100">
            {users.map((user) => {
              const isSelf = user.id === viewerId;
              const isAdmin = user.role === "admin";
              return (
                <div key={user.id} className="p-4 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4">
                    <div className="min-w-0">
                      <p className="font-semibold text-tmt-navy flex items-center gap-2 min-w-0">
                        <span className="truncate">{user.displayName}</span>
                        {isSelf && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide text-tmt-orange bg-tmt-orange/10 px-2 py-0.5 rounded-full shrink-0">
                            <ShieldCheck size={11} /> You
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                      {isSelf && (
                        <p className="text-xs text-gray-400 mt-0.5">
                          Your own active status is protected — ask another
                          administrator to change it.
                        </p>
                      )}
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      {/* Role — display only. There is no in-app way to
                          change an account's role; see the component doc
                          comment for why. */}
                      <span
                        className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                          isAdmin
                            ? "bg-tmt-navy/10 text-tmt-navy"
                            : "bg-blue-50 text-blue-700"
                        }`}
                      >
                        {isAdmin ? "Admin/EIC" : "Editor"}
                      </span>

                      <button
                        onClick={() => toggleActive(user)}
                        disabled={isSelf}
                        title={isSelf ? "You cannot deactivate your own account." : undefined}
                        className={`p-2 rounded transition-colors shrink-0 disabled:opacity-50 disabled:cursor-not-allowed ${
                          user.active
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-400 hover:bg-gray-100"
                        }`}
                        aria-label={user.active ? "Deactivate" : "Activate"}
                      >
                        {user.active ? <CheckCircle2 size={18} /> : <Ban size={18} />}
                      </button>

                      {/* Delete — Editor accounts only. Scoped server-side
                          too (deleteUserPermanently rejects non-Editor
                          targets), so this is never offered for Admin rows. */}
                      {!isAdmin && (
                        <button
                          onClick={() => handleDelete(user)}
                          disabled={deletingId === user.id}
                          title="Permanently delete this editor account"
                          className="p-2 rounded transition-colors shrink-0 text-gray-400 hover:bg-red-50 hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                          aria-label="Delete"
                        >
                          {deletingId === user.id ? (
                            <Loader2 size={18} className="animate-spin" />
                          ) : (
                            <Trash2 size={18} />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Article Approval Authority — editors only. Admins have
                      it intrinsically (see canApproveArticles() in
                      permissions.ts), so there's nothing to toggle for them. */}
                  <div className="flex items-center gap-2.5 pl-0.5">
                    <ShieldCheck
                      size={14}
                      className={isAdmin || user.canApproveArticles ? "text-tmt-orange" : "text-gray-300"}
                    />
                    {isAdmin ? (
                      <span className="text-sm text-gray-500">
                        Article Approval Authority: <span className="font-medium text-tmt-navy">Full (Admin/EIC)</span>
                      </span>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <span className="text-sm text-gray-600">Article Approval Authority</span>
                        <input
                          type="checkbox"
                          checked={user.canApproveArticles}
                          onChange={() => toggleApproval(user)}
                          disabled={savingApproval === user.id}
                          className="w-4 h-4 rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange"
                        />
                        <span
                          className={`text-xs font-semibold ${
                            user.canApproveArticles ? "text-green-600" : "text-gray-400"
                          }`}
                        >
                          {savingApproval === user.id
                            ? "Saving…"
                            : user.canApproveArticles
                              ? "Yes"
                              : "No"}
                        </span>
                      </label>
                    )}
                  </div>

                  {rowError?.id === user.id && (
                    <p role="alert" className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg p-2">
                      {rowError.message}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        )}
        </div>
      </div>
    </div>
  );
}

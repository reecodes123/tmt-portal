"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { updateOwnProfile } from "@/lib/api-client";
import type { AppUser } from "@/types/domain";

interface Props {
  user: Pick<AppUser, "id" | "email" | "displayName" | "role" | "avatarUrl">;
}

export function ProfileForm({ user }: Props) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(user.displayName);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await updateOwnProfile({
        displayName,
        currentPassword: currentPassword || undefined,
        newPassword: newPassword || undefined,
      });
      setSuccess("Profile updated.");
      router.refresh();
      setCurrentPassword("");
      setNewPassword("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Update failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-xl bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-5"
    >
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div>
        <p className="block text-sm font-semibold text-tmt-navy mb-1.5">Email</p>
        <p className="text-gray-700 break-words">{user.email}</p>
      </div>
      <div>
        <p className="block text-sm font-semibold text-tmt-navy mb-1.5">Role</p>
        <p className="capitalize text-gray-700">{user.role}</p>
      </div>

      <div>
        <label
          htmlFor="displayName"
          className="block text-sm font-semibold text-tmt-navy mb-1.5"
        >
          Display name
        </label>
        <input
          id="displayName"
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
        />
      </div>

      <div className="pt-4 border-t border-gray-200 space-y-4">
        <p className="text-sm font-semibold text-tmt-navy">Change password</p>
        <input
          type="password"
          autoComplete="current-password"
          placeholder="Current password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
        />
        <input
          type="password"
          autoComplete="new-password"
          placeholder="New password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
        />
      </div>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
        Save
      </button>
    </form>
  );
}

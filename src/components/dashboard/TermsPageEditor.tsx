"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Save } from "lucide-react";
import { updateTermsPage } from "@/lib/api-client";
import { RichTextEditor } from "@/components/shared/RichTextEditor";
import type { TermsPage } from "@/types/domain";

interface Props {
  initialPage: TermsPage;
}

/**
 * Terms & Conditions editor — one rich-text document (same editor Article
 * uses), plus a version-bump toggle. Leaving it unchecked lets an admin fix
 * a typo without re-prompting every visitor and every staff account to
 * re-accept; checking it is what actually drives the acceptance gates in
 * TermsAcceptanceBanner and the dashboard re-acceptance interstitial.
 */
export function TermsPageEditor({ initialPage }: Props) {
  const [content, setContent] = useState(initialPage.content);
  const [version, setVersion] = useState(initialPage.version);
  const [bumpVersion, setBumpVersion] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      const saved = await updateTermsPage({ content, bumpVersion });
      setContent(saved.content);
      setVersion(saved.version);
      setBumpVersion(false);
      setSuccess(
        bumpVersion
          ? `Saved as version ${saved.version}. Visitors and staff will be asked to re-accept.`
          : "Saved."
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-6">
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-green-600">{success}</p>}

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-tmt-navy">Document</h2>
          <span className="text-xs font-semibold text-gray-400">
            Current version: v{version}
          </span>
        </div>
        <RichTextEditor
          value={content}
          onChange={setContent}
          placeholder="Write the Terms & Conditions here…"
        />
      </div>

      <label className="flex items-start gap-2 text-sm text-gray-700 bg-white rounded-xl shadow-md p-4">
        <input
          type="checkbox"
          checked={bumpVersion}
          onChange={(e) => setBumpVersion(e.target.checked)}
          className="mt-0.5 rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange"
        />
        <span>
          <span className="font-semibold text-tmt-navy">
            Publish as a new version.
          </span>{" "}
          Visitors will see the acceptance banner again, and staff will be
          asked to re-accept before continuing to use the dashboard. Leave
          unchecked for minor edits like typo fixes.
        </span>
      </label>

      <button
        type="submit"
        disabled={saving}
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
      >
        {saving ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Save size={16} />
        )}
        Save Terms &amp; Conditions
      </button>
    </form>
  );
}

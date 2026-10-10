"use client";

import { useEffect, useState, type FormEvent } from "react";
import { ImagePlus, Loader2 } from "lucide-react";
import { uploadMedia } from "@/lib/api-client";
import { TIER_LABELS, TIER_ORDER } from "@/types/domain";
import type { BoardMember, BoardTier, Position } from "@/types/domain";

export interface BoardMemberFormValues {
  name: string;
  positionId: string;
  description?: string;
  imageUrl?: string | null;
}

interface Props {
  positions: Position[];
  existingMember?: BoardMember;
  defaultTier?: BoardTier;
  onSave: (values: BoardMemberFormValues) => Promise<void>;
  onCancel: () => void;
  /**
   * Fired on every field change with the form's *current, unsaved* values —
   * purely for the parent's "Preview Organizational Chart" feature to render
   * live edits before Save is clicked. Never used for persistence; the form
   * still only writes to the database via onSave.
   */
  onDraftChange?: (values: BoardMemberFormValues) => void;
}

/**
 * Add/edit form for a single org-chart entry. The Position picker replaces
 * free-text title entry — see Position's schema comment for why. Photo
 * upload reuses the exact pattern ArticleEditorForm uses for cover images.
 */
export function BoardMemberForm({
  positions,
  existingMember,
  defaultTier,
  onSave,
  onCancel,
  onDraftChange,
}: Props) {
  const sortedPositions = positions
    .slice()
    .sort(
      (a, b) =>
        TIER_ORDER.indexOf(a.tier) - TIER_ORDER.indexOf(b.tier) ||
        a.sortOrder - b.sortOrder
    );

  const defaultPositionId =
    existingMember?.positionId ??
    sortedPositions.find((p) => p.tier === defaultTier)?.id ??
    sortedPositions[0]?.id ??
    "";

  const [name, setName] = useState(existingMember?.name ?? "");
  const [positionId, setPositionId] = useState(defaultPositionId);
  const [description, setDescription] = useState(
    existingMember?.description ?? ""
  );
  const [imageUrl, setImageUrl] = useState<string | null>(
    existingMember?.imageUrl ?? null
  );
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Report the live, unsaved field values up on every change — see
  // onDraftChange's doc comment. This never touches the network; onSave
  // (triggered only by submitting the form) remains the only write path.
  useEffect(() => {
    onDraftChange?.({
      name,
      positionId,
      description: description.trim() || undefined,
      imageUrl,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [name, positionId, description, imageUrl]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError("");
    try {
      const asset = await uploadMedia(file);
      setImageUrl(asset.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !positionId) {
      setError("Name and position are required.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await onSave({
        name: name.trim(),
        positionId,
        description: description.trim() || undefined,
        imageUrl,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-4 lg:sticky lg:top-6"
    >
      <h2 className="font-bold text-tmt-navy">
        {existingMember ? "Edit board member" : "Add board member"}
      </h2>
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {sortedPositions.length === 0 && (
        <p className="text-sm text-amber-600 bg-amber-50 border border-amber-200 rounded-lg p-3">
          No positions exist yet. Add one under Dashboard → Positions first.
        </p>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        {imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageUrl}
            alt=""
            className="w-16 h-16 rounded-full object-cover shrink-0"
          />
        ) : (
          <div className="w-16 h-16 rounded-full bg-gray-100 border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 shrink-0">
            <ImagePlus size={20} />
          </div>
        )}
        <div className="flex flex-col gap-1.5">
          <label className="cursor-pointer inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-gray-700 transition-colors">
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            {uploading ? (
              <>
                <Loader2 size={14} className="animate-spin" /> Uploading…
              </>
            ) : (
              <>
                <ImagePlus size={14} /> {imageUrl ? "Change photo" : "Upload photo"}
              </>
            )}
          </label>
          {imageUrl && (
            <button
              type="button"
              onClick={() => setImageUrl(null)}
              className="text-xs text-gray-400 hover:text-red-600 text-left"
            >
              Remove photo
            </button>
          )}
        </div>
      </div>

      <div>
        <label
          htmlFor="bm-name"
          className="block text-sm font-semibold text-tmt-navy mb-1.5"
        >
          Name
        </label>
        <input
          id="bm-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
        />
      </div>

      <div>
        <label
          htmlFor="bm-position"
          className="block text-sm font-semibold text-tmt-navy mb-1.5"
        >
          Position
        </label>
        <select
          id="bm-position"
          value={positionId}
          onChange={(e) => setPositionId(e.target.value)}
          disabled={sortedPositions.length === 0}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-tmt-orange focus:outline-none disabled:opacity-60"
        >
          {sortedPositions.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {TIER_LABELS[p.tier]}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label
          htmlFor="bm-desc"
          className="block text-sm font-semibold text-tmt-navy mb-1.5"
        >
          Description
        </label>
        <textarea
          id="bm-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none resize-y"
        />
      </div>

      <div className="flex items-center gap-3 pt-2">
        <button
          type="submit"
          disabled={saving || uploading || sortedPositions.length === 0}
          className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          {existingMember ? "Save changes" : "Add member"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          disabled={saving}
          className="px-4 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

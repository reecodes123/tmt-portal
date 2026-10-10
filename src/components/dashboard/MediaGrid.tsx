"use client";

import { useState } from "react";
import { Trash2, Upload } from "lucide-react";
import { deleteMediaAsset, uploadMedia } from "@/lib/api-client";
import type { MediaAsset, UserRole } from "@/types/domain";

interface Props {
  initialItems: MediaAsset[];
  viewerRole: UserRole;
}

export function MediaGrid({ initialItems, viewerRole }: Props) {
  const [items, setItems] = useState(initialItems);
  const [uploading, setUploading] = useState(false);

  const handleUpload = async (file: File) => {
    setUploading(true);
    try {
      const asset = await uploadMedia(file);
      setItems((prev) => [asset, ...prev]);
    } catch (err) {
      alert(err instanceof Error ? err.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (asset: MediaAsset) => {
    if (!window.confirm(`Delete "${asset.fileName}"? This can't be undone.`)) return;
    // Optimistic, rolled back on failure — deleteMedia() already rejects
    // (with a clear message) an asset still referenced by an article, so
    // that common failure case restores the tile with an explanation
    // rather than silently losing it.
    const previous = items;
    setItems((prev) => prev.filter((a) => a.id !== asset.id));
    try {
      await deleteMediaAsset(asset.id);
    } catch (err) {
      setItems(previous);
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div>
      <div className="mb-6">
        <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors">
          <input
            type="file"
            accept="image/*,application/pdf"
            className="sr-only"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleUpload(file);
            }}
          />
          <Upload size={18} />
          {uploading ? "Uploading…" : "Upload"}
        </label>
      </div>

      {items.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 text-center text-gray-500">
          No uploads yet.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((asset) => (
            <div
              key={asset.id}
              className="bg-white rounded-xl shadow-md overflow-hidden group"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={asset.url}
                alt={asset.fileName}
                className="w-full h-32 object-cover"
              />
              <div className="p-3 flex items-center justify-between gap-2">
                <p className="text-xs text-gray-600 truncate">
                  {asset.fileName}
                </p>
                {viewerRole === "admin" && (
                  <button
                    onClick={() => handleDelete(asset)}
                    className="p-1.5 rounded text-gray-400 hover:bg-red-50 hover:text-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    aria-label="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

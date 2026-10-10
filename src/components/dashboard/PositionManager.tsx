"use client";

import { useState, type FormEvent } from "react";
import { Loader2, Pencil, Plus, Trash2 } from "lucide-react";
import { createPosition, deletePosition, updatePosition } from "@/lib/api-client";
import { TIER_LABELS, TIER_ORDER } from "@/types/domain";
import type { BoardTier, Position } from "@/types/domain";

interface Props {
  initialPositions: Position[];
}

/**
 * Admin-manageable catalog of editorial titles — Dashboard → Positions.
 * Assigning someone to a title happens on the Editorial Board page; this is
 * just the controlled vocabulary that page's Position picker draws from.
 */
export function PositionManager({ initialPositions }: Props) {
  const [positions, setPositions] = useState(initialPositions);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [tier, setTier] = useState<BoardTier>(TIER_ORDER[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const grouped = TIER_ORDER.map((t) => ({
    tier: t,
    label: TIER_LABELS[t],
    items: positions
      .filter((p) => p.tier === t)
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name)),
  }));

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setTier(TIER_ORDER[0]);
    setError("");
  };

  const startEdit = (position: Position) => {
    setEditingId(position.id);
    setName(position.name);
    setTier(position.tier);
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (editingId) {
        const updated = await updatePosition(editingId, { name: name.trim(), tier });
        setPositions((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        const tierItems = positions.filter((p) => p.tier === tier);
        const sortOrder =
          tierItems.length > 0 ? Math.max(...tierItems.map((p) => p.sortOrder)) + 1 : 0;
        const created = await createPosition({ name: name.trim(), tier, sortOrder });
        setPositions((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save.");
    } finally {
      setBusy(false);
    }
  };

  const handleDelete = async (position: Position) => {
    if (!window.confirm(`Delete the "${position.name}" position?`)) return;
    setError("");
    try {
      await deletePosition(position.id);
      setPositions((prev) => prev.filter((p) => p.id !== position.id));
    } catch (err) {
      // Surfaces the "N board members have this position" message from the
      // API when the position is still in use, instead of failing silently.
      alert(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-md p-5 sm:p-6 space-y-4 lg:sticky lg:top-6"
      >
        <h2 className="font-bold text-tmt-navy">
          {editingId ? "Edit position" : "Add position"}
        </h2>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div>
          <label htmlFor="pos-name" className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Title
          </label>
          <input
            id="pos-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Managing Editor"
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
          />
        </div>
        <div>
          <label htmlFor="pos-tier" className="block text-sm font-semibold text-tmt-navy mb-1.5">
            Tier (grouping/level on the org chart)
          </label>
          <select
            id="pos-tier"
            value={tier}
            onChange={(e) => setTier(e.target.value as BoardTier)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg bg-white focus:border-tmt-orange focus:outline-none"
          >
            {TIER_ORDER.map((t) => (
              <option key={t} value={t}>
                {TIER_LABELS[t]}
              </option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
          >
            {busy && <Loader2 size={16} className="animate-spin" />}
            {editingId ? "Save changes" : (
              <>
                <Plus size={16} /> Add
              </>
            )}
          </button>
          {editingId && (
            <button
              type="button"
              onClick={resetForm}
              disabled={busy}
              className="px-4 py-2.5 rounded-lg text-gray-500 hover:bg-gray-100 font-semibold transition-colors"
            >
              Cancel
            </button>
          )}
        </div>
      </form>

      <div className="lg:col-span-2 space-y-6">
        {grouped
          .filter((g) => g.items.length > 0)
          .map((group) => (
            <div key={group.tier} className="bg-white rounded-xl shadow-md overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold uppercase tracking-widest text-tmt-navy/50">
                  {group.label}
                </p>
              </div>
              <div className="divide-y divide-gray-100">
                {group.items.map((position) => (
                  <div key={position.id} className="flex items-center justify-between gap-4 p-4">
                    <p className="font-semibold text-tmt-navy">{position.name}</p>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => startEdit(position)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-gray-100"
                        aria-label={`Edit ${position.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(position)}
                        className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${position.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}

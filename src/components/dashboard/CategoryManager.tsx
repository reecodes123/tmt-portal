"use client";

import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { createCategory, deleteCategory, updateCategory } from "@/lib/api-client";
import type { Category } from "@/types/domain";

interface Props {
  initialCategories: Category[];
}

export function CategoryManager({ initialCategories }: Props) {
  const [items, setItems] = useState(initialCategories);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const resetForm = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setError("");
  };

  const startEdit = (category: Category) => {
    setEditingId(category.id);
    setName(category.name);
    setDescription(category.description ?? "");
    setError("");
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError("");
    try {
      if (editingId) {
        const updated = await updateCategory(editingId, {
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setItems((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      } else {
        const created = await createCategory({
          name: name.trim(),
          description: description.trim() || undefined,
        });
        setItems((prev) => [...prev, created]);
      }
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save category.");
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async (id: string) => {
    if (!window.confirm("Delete this category?")) return;
    // Optimistic, rolled back on failure — a category has no permission/
    // publication weight, and deleteCategory() already rejects (with a
    // clear message) a category that still has articles, so the common
    // failure case restores the row with an explanation rather than
    // silently losing it.
    const previous = items;
    setItems((prev) => prev.filter((c) => c.id !== id));
    try {
      await deleteCategory(id);
    } catch (err) {
      setItems(previous);
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
          {editingId ? "Edit category" : "Add category"}
        </h2>
        {error && (
          <p role="alert" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <div>
          <label
            htmlFor="cat-name"
            className="block text-sm font-semibold text-tmt-navy mb-1.5"
          >
            Name
          </label>
          <input
            id="cat-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none"
          />
        </div>
        <div>
          <label
            htmlFor="cat-desc"
            className="block text-sm font-semibold text-tmt-navy mb-1.5"
          >
            Description
          </label>
          <textarea
            id="cat-desc"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none resize-y"
          />
        </div>
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={busy}
            className="flex-1 inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
          >
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

      <div className="lg:col-span-2 bg-white rounded-xl shadow-md overflow-hidden">
        <div className="divide-y divide-gray-100">
          {items.map((cat) => (
            <div
              key={cat.id}
              className="flex items-center justify-between gap-4 p-4"
            >
              <div className="min-w-0">
                <p className="font-semibold text-tmt-navy">{cat.name}</p>
                <p className="text-xs text-gray-500 truncate">
                  /{cat.slug} &middot; {cat.description || "—"}
                </p>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <button
                  onClick={() => startEdit(cat)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                  aria-label={`Edit ${cat.name}`}
                >
                  <Pencil size={16} />
                </button>
                <button
                  onClick={() => handleRemove(cat.id)}
                  className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                  aria-label={`Delete ${cat.name}`}
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

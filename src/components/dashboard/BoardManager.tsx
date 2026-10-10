"use client";

import { useMemo, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  Eye,
  GripVertical,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  User,
  X,
} from "lucide-react";
import {
  createBoardMember,
  deleteBoardMember,
  updateBoardMember,
} from "@/lib/api-client";
import { BoardMemberForm, type BoardMemberFormValues } from "./BoardMemberForm";
import { EditorialOrgChart } from "@/components/public/EditorialOrgChart";
import { TIER_LABELS, TIER_ORDER } from "@/types/domain";
import type { BoardMember, BoardTier, Position } from "@/types/domain";

interface Props {
  initialMembers: BoardMember[];
  positions: Position[];
}

/** Groups + sorts members by tier — mirrors the public OrgChart's own logic. */
function groupByTier(members: BoardMember[]) {
  const byTier = new Map<BoardTier, BoardMember[]>();
  for (const tier of TIER_ORDER) byTier.set(tier, []);
  for (const member of members) {
    if (!byTier.has(member.positionTier)) byTier.set(member.positionTier, []);
    byTier.get(member.positionTier)!.push(member);
  }
  return TIER_ORDER.map((tier) => ({
    tier,
    label: TIER_LABELS[tier],
    members: (byTier.get(tier) ?? [])
      .slice()
      .sort((a, b) => a.sortOrder - b.sortOrder),
  }));
}

/**
 * Full add/edit/delete/reorder CRUD for the editorial board org chart.
 *
 * Reordering is drag-and-drop, built on the native HTML5 drag events rather
 * than a library — the lists are short and per-tier, so this avoids adding a
 * dependency for it. Up/down buttons are kept alongside because drag-and-drop
 * is unusable by keyboard and screen-reader users.
 *
 * Dragging is within a tier only (sortOrder is per-tier); moving someone to a
 * different tier is done through Edit, by picking a Position in a different
 * tier — tier itself is never set directly here.
 */
export function BoardManager({ initialMembers, positions }: Props) {
  const [members, setMembers] = useState(initialMembers);
  const [editing, setEditing] = useState<BoardMember | "new" | null>(null);
  const [pendingTier, setPendingTier] = useState<BoardTier | undefined>();
  const [dragging, setDragging] = useState<BoardMember | null>(null);
  const [dragOverId, setDragOverId] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState(false);
  const [error, setError] = useState("");
  const [draft, setDraft] = useState<BoardMemberFormValues | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);

  const groups = groupByTier(members);
  const tierByPositionId = new Map(positions.map((p) => [p.id, p.tier]));

  /**
   * What the public org chart would look like *right now*, including any
   * in-progress (not yet saved) add/edit form values — see
   * BoardMemberForm's onDraftChange. Purely a client-side projection: it
   * never reads from or writes to the API, so opening/closing the preview
   * can never persist or lose anything.
   */
  const previewMembers = useMemo<BoardMember[]>(() => {
    if (!editing || !draft || !draft.positionId) return members;
    const position = positions.find((p) => p.id === draft.positionId);
    if (!position) return members;

    const draftMember: BoardMember = {
      id: editing === "new" ? "__preview_new__" : editing.id,
      name: draft.name.trim() || "(Unnamed)",
      positionId: draft.positionId,
      positionName: position.name,
      positionTier: position.tier,
      description: draft.description ?? null,
      imageUrl: draft.imageUrl ?? null,
      sortOrder: editing === "new" ? Number.MAX_SAFE_INTEGER : editing.sortOrder,
      userId: editing === "new" ? null : editing.userId,
    };

    if (editing === "new") return [...members, draftMember];
    return members.map((m) => (m.id === editing.id ? draftMember : m));
  }, [members, editing, draft, positions]);

  const startAdd = (tier?: BoardTier) => {
    setPendingTier(tier);
    setEditing("new");
    setDraft(null);
    setError("");
  };

  const handleSave = async (values: BoardMemberFormValues) => {
    if (editing && editing !== "new") {
      const updated = await updateBoardMember(editing.id, values);
      setMembers((prev) => prev.map((m) => (m.id === updated.id ? updated : m)));
    } else {
      const tier = tierByPositionId.get(values.positionId);
      const tierMembers = members.filter((m) => m.positionTier === tier);
      const sortOrder =
        tierMembers.length > 0
          ? Math.max(...tierMembers.map((m) => m.sortOrder)) + 1
          : 0;
      const created = await createBoardMember({ ...values, sortOrder });
      setMembers((prev) => [...prev, created]);
    }
    setEditing(null);
    setDraft(null);
  };

  const handleDelete = async (member: BoardMember) => {
    if (!window.confirm(`Remove ${member.name} from the org chart?`)) return;
    setError("");
    try {
      await deleteBoardMember(member.id);
      setMembers((prev) => prev.filter((m) => m.id !== member.id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed.");
    }
  };

  /**
   * Writes a whole tier's new order. sortOrder is renumbered 0..n-1 and only
   * the rows that actually changed are PATCHed, so a drag across several
   * positions costs the minimum number of requests. Local state updates
   * optimistically and rolls back if any request fails.
   */
  const persistOrder = async (tier: BoardTier, ordered: BoardMember[]) => {
    const previous = members;
    const renumbered = ordered.map((m, i) => ({ ...m, sortOrder: i }));
    const changed = renumbered.filter((m) => {
      const before = previous.find((p) => p.id === m.id);
      return before && before.sortOrder !== m.sortOrder;
    });
    if (changed.length === 0) return;

    setMembers((prev) =>
      prev.map((m) => renumbered.find((r) => r.id === m.id) ?? m)
    );
    setSavingOrder(true);
    setError("");
    try {
      await Promise.all(
        changed.map((m) => updateBoardMember(m.id, { sortOrder: m.sortOrder }))
      );
    } catch (err) {
      setMembers(previous); // roll back so the UI can't disagree with the DB
      setError(err instanceof Error ? err.message : "Could not save the new order.");
    } finally {
      setSavingOrder(false);
    }
  };

  const handleMove = (
    tier: BoardTier,
    tierMembers: BoardMember[],
    index: number,
    direction: -1 | 1
  ) => {
    const target = index + direction;
    if (target < 0 || target >= tierMembers.length) return;
    const next = tierMembers.slice();
    [next[index], next[target]] = [next[target], next[index]];
    persistOrder(tier, next);
  };

  const handleDrop = (tier: BoardTier, tierMembers: BoardMember[], targetId: string) => {
    setDragOverId(null);
    const source = dragging;
    setDragging(null);
    if (!source || source.positionTier !== tier || source.id === targetId) return;

    const from = tierMembers.findIndex((m) => m.id === source.id);
    const to = tierMembers.findIndex((m) => m.id === targetId);
    if (from === -1 || to === -1) return;

    const next = tierMembers.slice();
    const [moved] = next.splice(from, 1);
    next.splice(to, 0, moved);
    persistOrder(tier, next);
  };

  return (
    <>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {editing ? (
        <BoardMemberForm
          // Force a remount when switching which member is being edited, so
          // the form's internal field state (and therefore the live preview
          // it reports via onDraftChange) always starts from that member's
          // real data instead of carrying over whoever was being edited before.
          key={editing === "new" ? "new" : editing.id}
          positions={positions}
          existingMember={editing === "new" ? undefined : editing}
          defaultTier={pendingTier}
          onSave={handleSave}
          onCancel={() => {
            setEditing(null);
            setDraft(null);
          }}
          onDraftChange={setDraft}
        />
      ) : (
        <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 lg:sticky lg:top-6 space-y-3">
          <button
            onClick={() => startAdd()}
            className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors"
          >
            <Plus size={16} /> Add board member
          </button>
          <p className="text-xs text-gray-500 leading-relaxed">
            Drag the <GripVertical size={12} className="inline -mt-0.5" /> handle
            to reorder people within a section. Use Edit to move someone to a
            different section.
          </p>
        </div>
      )}

      <div className="lg:col-span-2 space-y-6">
        <div className="flex items-center justify-between gap-3 bg-white rounded-xl shadow-md p-4">
          <div className="min-w-0">
            <p className="font-semibold text-tmt-navy text-sm sm:text-base">
              Preview Organizational Chart
            </p>
            <p className="text-xs text-gray-500 mt-0.5">
              {editing
                ? "Shows this section's current members plus your unsaved edit."
                : "Shows exactly what the public Editorial Board page renders."}
            </p>
          </div>
          <button
            onClick={() => setPreviewOpen(true)}
            className="shrink-0 inline-flex items-center gap-2 px-4 py-2.5 rounded-lg border-2 border-tmt-navy/20 text-tmt-navy hover:bg-tmt-navy/5 font-semibold transition-colors"
          >
            <Eye size={16} />
            Preview
          </button>
        </div>

        {error && (
          <p
            role="alert"
            className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3"
          >
            {error}
          </p>
        )}
        {savingOrder && (
          <p className="text-sm text-gray-500 flex items-center gap-2">
            <Loader2 size={14} className="animate-spin" /> Saving order…
          </p>
        )}

        {groups.map((group) => (
          <div
            key={group.tier}
            className="bg-white rounded-xl shadow-md overflow-hidden"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
              <p className="text-xs font-bold uppercase tracking-widest text-tmt-navy/50">
                {group.label}
              </p>
              <button
                onClick={() => startAdd(group.tier)}
                className="text-xs font-semibold text-tmt-orange hover:text-tmt-orange-light"
              >
                + Add here
              </button>
            </div>
            {group.members.length === 0 ? (
              <p className="px-4 py-4 text-sm text-gray-400">No members yet.</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {group.members.map((member, i) => (
                  <div
                    key={member.id}
                    draggable
                    onDragStart={() => setDragging(member)}
                    onDragEnd={() => {
                      setDragging(null);
                      setDragOverId(null);
                    }}
                    onDragOver={(e) => {
                      if (dragging && dragging.positionTier === group.tier) {
                        e.preventDefault();
                        setDragOverId(member.id);
                      }
                    }}
                    onDragLeave={() => setDragOverId((id) => (id === member.id ? null : id))}
                    onDrop={(e) => {
                      e.preventDefault();
                      handleDrop(group.tier, group.members, member.id);
                    }}
                    className={`flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 p-4 transition-colors ${
                      dragging?.id === member.id ? "opacity-40" : ""
                    } ${
                      dragOverId === member.id && dragging?.id !== member.id
                        ? "bg-tmt-orange/10 border-t-2 border-tmt-orange"
                        : ""
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span
                        className="hidden sm:inline-flex cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 shrink-0"
                        aria-hidden="true"
                      >
                        <GripVertical size={16} />
                      </span>
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-tmt-navy/5 flex items-center justify-center shrink-0">
                        {member.imageUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={member.imageUrl}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User size={18} className="text-tmt-navy/30" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-semibold text-tmt-navy truncate">
                          {member.name}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {member.positionName}
                        </p>
                      </div>
                    </div>
                    {/* Own row on mobile (drag doesn't work via touch on most
                        browsers anyway — see the sm:-only handle above), right-
                        aligned alongside the name/photo block from sm: up. */}
                    <div className="flex items-center gap-1 shrink-0 self-end sm:self-auto">
                      {/* Keyboard- and touch-accessible equivalent of dragging. */}
                      <button
                        onClick={() => handleMove(group.tier, group.members, i, -1)}
                        disabled={i === 0 || savingOrder}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                        aria-label={`Move ${member.name} up`}
                      >
                        <ChevronUp size={16} />
                      </button>
                      <button
                        onClick={() => handleMove(group.tier, group.members, i, 1)}
                        disabled={i === group.members.length - 1 || savingOrder}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 disabled:opacity-30"
                        aria-label={`Move ${member.name} down`}
                      >
                        <ChevronDown size={16} />
                      </button>
                      <button
                        onClick={() => {
                          setEditing(member);
                          setDraft(null);
                          setError("");
                        }}
                        className="p-2 rounded-lg text-gray-400 hover:bg-gray-100"
                        aria-label={`Edit ${member.name}`}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        onClick={() => handleDelete(member)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600"
                        aria-label={`Delete ${member.name}`}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>

    {previewOpen && (
      <div className="fixed inset-0 z-50 bg-tmt-navy/60 backdrop-blur-sm flex flex-col overflow-y-auto">
        <div className="sticky top-0 z-10 px-4 sm:px-6 py-3 bg-tmt-navy text-white flex flex-wrap items-center justify-between gap-3 shadow-md">
          <span className="inline-flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
            <Eye size={16} className="text-tmt-orange" />
            Org Chart Preview — unsaved changes included, nothing has been published
          </span>
          <button
            type="button"
            onClick={() => setPreviewOpen(false)}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-semibold transition-colors"
          >
            <X size={16} />
            Close Preview
          </button>
        </div>

        <div className="flex-1 py-8 sm:py-10 px-4">
          <div className="max-w-6xl mx-auto bg-white rounded-2xl shadow-xl p-5 sm:p-8 lg:p-10">
            <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-xl sm:text-2xl font-bold text-tmt-navy mb-2">
                Organizational Chart
              </h2>
              <p className="text-sm sm:text-base text-gray-500 max-w-xl mx-auto">
                This is what readers will see on the public Editorial Board page.
              </p>
              <div className="h-1 w-16 bg-gradient-to-r from-tmt-orange to-tmt-orange-light mx-auto mt-4 rounded-full" />
            </div>
            <EditorialOrgChart members={previewMembers} showEmptyTiers />
          </div>
        </div>
      </div>
    )}
    </>
  );
}

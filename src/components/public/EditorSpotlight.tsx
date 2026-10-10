import { User } from "lucide-react";
import type { BoardMember } from "@/types/domain";

interface Props {
  members: BoardMember[];
}

/**
 * Featured "About the Editor" section — a bigger, biography-style card for
 * whoever holds the Editor-in-Chief position, shown above the org chart.
 * Sources the exact same BoardMember fields (imageUrl, description) the
 * Editorial Board dashboard already edits — no separate data source, so
 * there's nothing else for an Admin to keep in sync.
 */
export function EditorSpotlight({ members }: Props) {
  const eic = members.find((m) => m.positionTier === "editor-in-chief");
  if (!eic) return null;

  return (
    <section className="mb-14 sm:mb-16">
      <div className="max-w-3xl mx-auto bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="sm:flex">
          <div className="sm:w-56 shrink-0 bg-gradient-to-br from-tmt-navy to-tmt-navy-light flex items-center justify-center p-8">
            <div className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden ring-4 ring-white/20 flex items-center justify-center bg-white/10">
              {eic.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={eic.imageUrl} alt={eic.name} className="w-full h-full object-cover" />
              ) : (
                <User size={56} className="text-white/70" />
              )}
            </div>
          </div>
          <div className="p-6 sm:p-8 flex flex-col justify-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-tmt-orange mb-2">
              About the Editor
            </p>
            <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-1">
              {eic.name}
            </h2>
            <p className="text-sm font-semibold text-tmt-orange mb-4">
              {eic.positionName}
            </p>
            {eic.description ? (
              <p className="text-gray-600 leading-relaxed">{eic.description}</p>
            ) : (
              <p className="text-gray-400 italic text-sm">
                No biography added yet.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Calendar, Eye, User } from "lucide-react";

export interface ArticleContentProps {
  categoryLabel: string;
  title: string;
  subheadline?: string | null;
  /** The manually entered byline — see Article.articleBy. Never the account name or a Position. */
  articleBy: string;
  /** Pre-formatted date string, e.g. "August 29, 2026" — or a preview-specific label. */
  dateLabel: string;
  /** Omit entirely (undefined) to hide the views stat — used by the preview, which has no real view count yet. */
  viewsLabel?: string;
  coverImageUrl?: string | null;
  photoCredit?: string | null;
  /** Must already be sanitized by the caller — this component does not sanitize. */
  contentHtml: string;
}

/**
 * The headline/byline/cover/body block shared by the real public article
 * page and the dashboard's unsaved-draft Preview. Kept deliberately narrow —
 * just the part that's genuinely the same in both places. Page-level
 * concerns (back link, engagement bar, share buttons, related articles) stay
 * in the public page itself; a draft being previewed has none of those
 * (no real id to like/bookmark, no slug to share).
 */
export function ArticleContent({
  categoryLabel,
  title,
  subheadline,
  articleBy,
  dateLabel,
  viewsLabel,
  coverImageUrl,
  photoCredit,
  contentHtml,
}: ArticleContentProps) {
  return (
    <>
      <span className="inline-block px-3 py-1 bg-tmt-orange text-white text-xs font-semibold rounded-full uppercase mb-4">
        {categoryLabel}
      </span>

      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-tmt-navy mb-3 leading-tight break-words">
        {title || "Untitled Article"}
      </h1>

      {subheadline && (
        <p className="text-lg sm:text-xl text-gray-600 mb-5 break-words">{subheadline}</p>
      )}

      <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mb-6 pb-6 border-b border-gray-200">
        <span className="flex items-center gap-1.5 min-w-0">
          <User size={15} className="shrink-0" />
          <span className="truncate">By {articleBy || "—"}</span>
        </span>
        <span className="flex items-center gap-1.5 shrink-0">
          <Calendar size={15} />
          {dateLabel}
        </span>
        {viewsLabel !== undefined && (
          <span className="flex items-center gap-1.5 shrink-0">
            <Eye size={15} />
            {viewsLabel}
          </span>
        )}
      </div>

      {coverImageUrl && (
        <figure className="mb-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={coverImageUrl}
            alt=""
            className="w-full h-64 sm:h-96 object-cover rounded-2xl shadow-lg"
          />
          {photoCredit && (
            <figcaption className="text-xs text-gray-400 mt-2 text-right">
              Photo by: {photoCredit}
            </figcaption>
          )}
        </figure>
      )}

      <div className="article-body" dangerouslySetInnerHTML={{ __html: contentHtml }} />
    </>
  );
}

"use client";

import { useEffect, useState } from "react";
import { Bookmark, Heart } from "lucide-react";
import { useLocalBookmarks } from "@/hooks/useLocalBookmarks";
import { useLocalLikes } from "@/hooks/useLocalLikes";
import { recordView, toggleBookmark, toggleLike } from "@/lib/api-client";

interface Props {
  articleId: string;
  initialLikes: number;
  initialBookmarks: number;
}

/**
 * Like / bookmark controls for anonymous readers.
 *
 * The reader's own state lives in their browser; the server only ever sees
 * "increment" or "decrement" with no identifier attached. That's what lets the
 * portal offer engagement features while collecting zero personal data.
 */
export function ArticleEngagementBar({
  articleId,
  initialLikes,
  initialBookmarks,
}: Props) {
  const likes = useLocalLikes();
  const bookmarks = useLocalBookmarks();
  const [likeCount, setLikeCount] = useState(initialLikes);
  const [bookmarkCount, setBookmarkCount] = useState(initialBookmarks);

  useEffect(() => {
    recordView(articleId).catch(() => {});
  }, [articleId]);

  const onLike = async () => {
    const active = likes.toggle(articleId);
    setLikeCount((n) => n + (active ? 1 : -1));
    try {
      await toggleLike(articleId, active);
    } catch {
      // Roll back the optimistic update if the write failed.
      likes.toggle(articleId);
      setLikeCount((n) => n + (active ? -1 : 1));
    }
  };

  const onBookmark = async () => {
    const active = bookmarks.toggle(articleId);
    setBookmarkCount((n) => n + (active ? 1 : -1));
    try {
      await toggleBookmark(articleId, active);
    } catch {
      bookmarks.toggle(articleId);
      setBookmarkCount((n) => n + (active ? -1 : 1));
    }
  };

  const liked = likes.has(articleId);
  const bookmarked = bookmarks.has(articleId);

  return (
    <div className="flex items-center gap-3 mt-10 pt-6 border-t border-gray-200">
      <button
        onClick={onLike}
        aria-pressed={liked}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-colors ${
          liked
            ? "bg-red-50 text-red-600"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Heart size={18} fill={liked ? "currentColor" : "none"} />
        {likeCount.toLocaleString()}
        <span className="sr-only">{liked ? "Unlike" : "Like"} this article</span>
      </button>

      <button
        onClick={onBookmark}
        aria-pressed={bookmarked}
        className={`flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold transition-colors ${
          bookmarked
            ? "bg-tmt-orange/10 text-tmt-orange"
            : "bg-gray-100 text-gray-600 hover:bg-gray-200"
        }`}
      >
        <Bookmark size={18} fill={bookmarked ? "currentColor" : "none"} />
        {bookmarkCount.toLocaleString()}
        <span className="sr-only">
          {bookmarked ? "Remove bookmark" : "Bookmark"} this article
        </span>
      </button>
    </div>
  );
}

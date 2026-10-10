import type { Metadata } from "next";
import { BookmarksList } from "@/components/public/BookmarksList";

export const metadata: Metadata = {
  title: "Your Bookmarks",
  description: "Articles you've saved to read later.",
  robots: { index: false, follow: true },
};

export default function BookmarksPage() {
  return <BookmarksList />;
}

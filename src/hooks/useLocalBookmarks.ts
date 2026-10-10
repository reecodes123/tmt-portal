"use client";

import { readSet, useLocalStorageSet } from "./useLocalStorageSet";

export const BOOKMARKS_KEY = "tmt_bookmarked_articles";

/**
 * Reader bookmarks, stored per-browser.
 *
 * TRADE-OFF worth stating in the UI: bookmarks live in this browser only, so
 * they don't follow the reader across devices and are lost if site data is
 * cleared. That is the price of collecting no personal data — the alternative
 * (server-side bookmarks) would require reader accounts.
 */
export function useLocalBookmarks() {
  return useLocalStorageSet(BOOKMARKS_KEY);
}

/** Non-hook read, for use outside React. */
export function getLocalBookmarks(): Set<string> {
  return readSet(BOOKMARKS_KEY);
}

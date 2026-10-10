"use client";

import { readSet, useLocalStorageSet } from "./useLocalStorageSet";

export const LIKES_KEY = "tmt_liked_articles";

/** Reader likes, stored per-browser. See useLocalBookmarks for the trade-off. */
export function useLocalLikes() {
  return useLocalStorageSet(LIKES_KEY);
}

/** Non-hook read, for use outside React. */
export function getLocalLikes(): Set<string> {
  return readSet(LIKES_KEY);
}

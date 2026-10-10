"use client";

import { useCallback, useEffect, useState } from "react";

/**
 * A Set<string> persisted to localStorage, exposed as React state.
 *
 * Shared by the bookmark and like hooks — the prototype duplicated this logic
 * twice with near-identical read/write helpers.
 */
export function useLocalStorageSet(storageKey: string) {
  const [ids, setIds] = useState<Set<string>>(new Set());
  const [hydrated, setHydrated] = useState(false);

  // Read on mount only. Server-rendered HTML must not depend on localStorage,
  // or React will report a hydration mismatch.
  useEffect(() => {
    setIds(readSet(storageKey));
    setHydrated(true);
  }, [storageKey]);

  const toggle = useCallback(
    (id: string): boolean => {
      const next = new Set(readSet(storageKey));
      const nowActive = !next.has(id);
      if (nowActive) next.add(id);
      else next.delete(id);
      writeSet(storageKey, next);
      setIds(next);
      return nowActive;
    },
    [storageKey]
  );

  const has = useCallback((id: string) => ids.has(id), [ids]);

  return { ids, has, toggle, hydrated };
}

export function readSet(key: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = window.localStorage.getItem(key);
    return new Set(raw ? (JSON.parse(raw) as string[]) : []);
  } catch {
    return new Set();
  }
}

export function writeSet(key: string, value: Set<string>): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(Array.from(value)));
  } catch {
    /* quota exceeded or storage disabled — non-critical */
  }
}

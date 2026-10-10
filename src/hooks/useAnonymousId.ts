"use client";

/**
 * Anonymous reader identity.
 *
 * Ported from the prototype's `hooks/useAnonymousId.ts`, which bundled three
 * concerns into one file. Split here into id / bookmarks / likes so each has a
 * single responsibility.
 *
 * PRIVACY: this identifier never leaves the browser. It is not sent with
 * like/bookmark requests and is not stored server-side. The server keeps only
 * aggregate counters, so no reader is identifiable — which is what keeps the
 * portal compliant with RA 10173 (Data Privacy Act of 2012) without a consent
 * flow for readers.
 */

const STORAGE_KEY = "tmt_anonymous_id";

export function getAnonymousId(): string {
  if (typeof window === "undefined") return "server";

  let id = window.localStorage.getItem(STORAGE_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    window.localStorage.setItem(STORAGE_KEY, id);
  }
  return id;
}

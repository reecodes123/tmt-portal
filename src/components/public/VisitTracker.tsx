"use client";

import { useEffect } from "react";
import { todayKey } from "@/lib/date";

const VISITED_KEY = "tmt_visited_on";

/**
 * Records one anonymous visit per browser per day.
 *
 * Privacy note: no identifier is sent. The server increments a per-day counter
 * and nothing else, so a visit can never be traced back to a reader. The
 * once-per-day check lives in localStorage for the same reason.
 */
export function VisitTracker() {
  useEffect(() => {
    const today = todayKey();
    if (window.localStorage.getItem(VISITED_KEY) === today) return;

    fetch("/api/analytics/visit", { method: "POST" })
      .then(() => window.localStorage.setItem(VISITED_KEY, today))
      .catch(() => {
        /* non-critical */
      });
  }, []);

  return null;
}

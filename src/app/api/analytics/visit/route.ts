import type { NextRequest } from "next/server";
import { recordDailyVisit } from "@/server/repositories/analytics";
import { todayKey } from "@/lib/date";
import { checkRateLimit } from "@/server/rateLimit";
import { handle, RateLimitError } from "../../_helpers";

/**
 * Public — increments a counter. No identifier stored, ever. Rate-limited so
 * a single browser can't game visit counts by clearing localStorage and
 * re-POSTing in a loop — see server/rateLimit.ts for the design note.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    if (!checkRateLimit(request, "analytics-visit", 10, 60_000)) {
      throw new RateLimitError();
    }
    await recordDailyVisit(todayKey());
  });
}

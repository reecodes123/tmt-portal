import { requireUser, AuthError } from "@/server/auth";
import { canViewAnalytics } from "@/server/permissions";
import { getAnalyticsPayload, resolveRange } from "@/server/repositories/analytics";
import { analyticsRangeQuerySchema } from "@/lib/validation";
import { handle, parseQuery } from "../_helpers";

/**
 * Admin-only. Accepts either `?preset=7d` (one of RANGE_PRESETS' keys) or an
 * explicit `?from=YYYY-MM-DD&to=YYYY-MM-DD` custom range; defaults to the
 * repository's default (1 month) if neither is given.
 */
export async function GET(request: Request) {
  return handle(async () => {
    const user = await requireUser();
    if (!canViewAnalytics(user)) throw new AuthError("Forbidden.", 403);

    const query = parseQuery(request, analyticsRangeQuerySchema);
    const range = resolveRange(query.preset ?? null, query.from, query.to);
    return getAnalyticsPayload(range);
  });
}

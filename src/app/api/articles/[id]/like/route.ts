import type { NextRequest } from "next/server";
import { adjustArticleLikes } from "@/server/repositories/articles";
import { engagementSchema } from "@/lib/validation";
import { checkRateLimit } from "@/server/rateLimit";
import { handle, parseJson, RateLimitError } from "../../../_helpers";

/**
 * Anonymous engagement endpoint — no auth required. See server/rateLimit.ts
 * for why this is a process-local limiter rather than the originally-noted
 * Vercel KV + @upstash/ratelimit (that needs infra this change can't add).
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (!checkRateLimit(request, "article-like", 30, 60_000)) {
      throw new RateLimitError();
    }
    const { id } = await ctx.params;
    const { active } = await parseJson(request, engagementSchema);
    await adjustArticleLikes(id, active ? 1 : -1);
    return { articleId: id };
  });
}

import type { NextRequest } from "next/server";
import { incrementArticleViews } from "@/server/repositories/articles";
import { checkRateLimit } from "@/server/rateLimit";
import { handle, RateLimitError } from "../../../_helpers";

/** Anonymous. See ../like/route.ts for the rate-limiting design note. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (!checkRateLimit(request, "article-view", 60, 60_000)) {
      throw new RateLimitError();
    }
    const { id } = await ctx.params;
    await incrementArticleViews(id);
  });
}

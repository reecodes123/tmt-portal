import type { NextRequest } from "next/server";
import { adjustArticleBookmarks } from "@/server/repositories/articles";
import { engagementSchema } from "@/lib/validation";
import { checkRateLimit } from "@/server/rateLimit";
import { handle, parseJson, RateLimitError } from "../../../_helpers";

/** Anonymous. See ../like/route.ts for the rate-limiting design note. */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  return handle(async () => {
    if (!checkRateLimit(request, "article-bookmark", 30, 60_000)) {
      throw new RateLimitError();
    }
    const { id } = await ctx.params;
    const { active } = await parseJson(request, engagementSchema);
    await adjustArticleBookmarks(id, active ? 1 : -1);
    return { articleId: id };
  });
}

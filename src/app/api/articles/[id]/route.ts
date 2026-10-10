import type { NextRequest } from "next/server";
import { getCurrentUser, requireUser, AuthError } from "@/server/auth";
import {
  deleteArticle,
  getArticleById,
  updateArticle,
} from "@/server/repositories/articles";
import {
  canDeleteArticle,
  canEditArticle,
  canPublishArticle,
} from "@/server/permissions";
import { updateArticleSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * By id, unlike the public site's by-slug route — this is the one other
 * callers (and, historically, a hand-crafted request) could reach directly.
 *
 * A published article is public exactly like the public site's own
 * /articles/[slug] page. Anything NOT published (draft, in_review,
 * needs_revision) is editorial content that hasn't cleared review — it must
 * only be visible to the account that owns it or an admin, the same rule
 * PATCH/DELETE on this route already enforce. Previously this returned any
 * article, including full draft content, to a request with no session at
 * all — see the 2026 pre-deployment audit.
 */
export async function GET(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const { id } = await ctx.params;
    const article = await getArticleById(id);
    if (!article) throw new AuthError("Not found.", 401);

    if (article.status !== "published") {
      const user = await getCurrentUser();
      if (!canEditArticle(user, article)) {
        // Same response a nonexistent id gets — this must not confirm to an
        // unauthorized caller that an unpublished article with this id exists.
        throw new AuthError("Not found.", 401);
      }
    }

    return article;
  });
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const existing = await getArticleById(id);
    if (!existing) throw new AuthError("Not found.", 401);
    if (!canEditArticle(user, existing)) {
      throw new AuthError("You cannot edit this article.", 403);
    }
    const body = await parseJson(request, updateArticleSchema);
    // Approving (-> published) and rejecting (-> needs_revision) a pending
    // article are both review decisions, distinct from ordinary editing: an
    // editor may edit/submit their own article, but moving it into either of
    // these requires canApproveArticles() — admin always, or an editor the
    // EIC has explicitly delegated approval authority to. Only gate the
    // transition itself, not every PATCH, so the ordinary draft/submit and
    // revise/resubmit flows are untouched.
    const isReviewDecision =
      (body.status === "published" || body.status === "needs_revision") &&
      body.status !== existing.status;
    if (isReviewDecision && !canPublishArticle(user)) {
      throw new AuthError(
        "You don't have approval authority for this article.",
        403
      );
    }
    const isNewlyPublished = body.status === "published" && existing.status !== "published";
    const isRejected = body.status === "needs_revision" && existing.status !== "needs_revision";
    const updated = await updateArticle(id, body);
    void recordActivity({
      actorId: user.id,
      action: isNewlyPublished ? "article.publish" : "article.update",
      targetType: "article",
      targetId: id,
      summary: isNewlyPublished
        ? `Published article "${updated.title}"`
        : isRejected
          ? `Requested revisions on "${updated.title}"`
          : `Updated article "${updated.title}"`,
    });
    return updated;
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    const { id } = await ctx.params;
    const existing = await getArticleById(id);
    if (!existing) throw new AuthError("Not found.", 401);
    if (!canDeleteArticle(user, existing)) {
      throw new AuthError("You cannot delete this article.", 403);
    }
    await deleteArticle(id);
    void recordActivity({
      actorId: user.id,
      action: "article.delete",
      targetType: "article",
      targetId: id,
      summary: `Deleted article "${existing.title}"`,
    });
  });
}

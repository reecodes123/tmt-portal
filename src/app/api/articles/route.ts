import type { NextRequest } from "next/server";
import { requireUser } from "@/server/auth";
import { canCreateArticle, canPublishArticle } from "@/server/permissions";
import {
  createArticle,
  listAllArticles,
  listArticlesByAuthor,
  listPublishedArticles,
} from "@/server/repositories/articles";
import {
  articleListQuerySchema,
  createArticleSchema,
} from "@/lib/validation";
import { AuthError, getCurrentUser } from "@/server/auth";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson, parseQuery } from "../_helpers";

export async function GET(request: NextRequest) {
  return handle(async () => {
    const query = parseQuery(request, articleListQuerySchema);
    const viewer = await getCurrentUser();

    // Anonymous callers only ever see published articles.
    if (!viewer) return listPublishedArticles(query);

    if (query.status || query.authorId) {
      // Editors may only list their own; admins may query anyone.
      if (viewer.role !== "admin" && query.authorId && query.authorId !== viewer.id) {
        throw new AuthError("You may only list your own articles.", 403);
      }
      return viewer.role === "admin"
        ? listAllArticles(query)
        : listArticlesByAuthor(viewer.id, query);
    }

    return listPublishedArticles(query);
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canCreateArticle(user)) {
      throw new AuthError("You cannot create articles.", 403);
    }
    const body = await parseJson(request, createArticleSchema);
    // A brand-new article can be created directly as "published" or
    // "needs_revision" only by someone with approval authority — otherwise
    // this endpoint would let any editor bypass the entire review pipeline
    // by simply never going through "draft"/"in_review" in the first place.
    if (
      (body.status === "published" || body.status === "needs_revision") &&
      !canPublishArticle(user)
    ) {
      throw new AuthError(
        "You don't have approval authority — save this as a draft or submit it for review instead.",
        403
      );
    }
    // authorName is no longer passed in — it's derived from the joined
    // user row, so a display-name change is reflected on existing articles.
    const created = await createArticle({ ...body, authorId: user.id });
    void recordActivity({
      actorId: user.id,
      action: "article.create",
      targetType: "article",
      targetId: created.id,
      summary: `Created article "${created.title}"`,
    });
    return created;
  });
}

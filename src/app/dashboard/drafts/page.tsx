import { ArticleTable } from "@/components/dashboard/ArticleTable";
import { getCurrentUser } from "@/server/auth";
import { canApproveArticles } from "@/server/permissions";
import {
  listAllArticles,
  listArticlesByAuthor,
} from "@/server/repositories/articles";

export default async function DraftsPage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const { items } =
    user.role === "admin"
      ? await listAllArticles({ pageSize: 60 })
      : await listArticlesByAuthor(user.id, { pageSize: 60 });

  // "needs_revision" belongs here too — this is exactly where an editor
  // comes to find a rejected article and fix it before resubmitting.
  const drafts = items.filter(
    (a) =>
      a.status === "draft" ||
      a.status === "in_review" ||
      a.status === "needs_revision"
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">
          Drafts &amp; In Review
        </h1>
        <p className="text-gray-500 mt-1 text-sm">
          Unpublished articles you can keep working on.
        </p>
      </div>

      <ArticleTable
        articles={drafts}
        viewerRole={user.role}
        viewerId={user.id}
        viewerCanApprove={canApproveArticles(user)}
      />
    </div>
  );
}

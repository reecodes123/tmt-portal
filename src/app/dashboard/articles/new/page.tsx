import { ArticleEditorForm } from "@/components/dashboard/ArticleEditorForm";
import { getCurrentUser } from "@/server/auth";
import { canApproveArticles } from "@/server/permissions";
import { listCategories } from "@/server/repositories/categories";

export default async function NewArticlePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  const categories = await listCategories();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        New Article
      </h1>
      <ArticleEditorForm
        categories={categories}
        author={{ id: user.id, displayName: user.displayName, role: user.role }}
        canApprove={canApproveArticles(user)}
      />
    </div>
  );
}

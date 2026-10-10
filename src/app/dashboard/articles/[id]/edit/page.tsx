import { notFound } from "next/navigation";
import { ArticleEditorForm } from "@/components/dashboard/ArticleEditorForm";
import { getCurrentUser } from "@/server/auth";
import { getArticleById } from "@/server/repositories/articles";
import { listCategories } from "@/server/repositories/categories";
import { canApproveArticles, canEditArticle } from "@/server/permissions";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function EditArticlePage({ params }: PageProps) {
  const user = await getCurrentUser();
  if (!user) return null;

  const { id } = await params;
  const article = await getArticleById(id);
  if (!article) notFound();

  // Even though the layout already gated the dashboard, we check per-resource
  // here — editors may only touch their own articles. This mirrors what the
  // PATCH/DELETE API routes enforce.
  if (!canEditArticle(user, article)) {
    notFound();
  }

  const categories = await listCategories();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        Edit Article
      </h1>
      <ArticleEditorForm
        categories={categories}
        author={{ id: user.id, displayName: user.displayName, role: user.role }}
        canApprove={canApproveArticles(user)}
        existingArticle={article}
      />
    </div>
  );
}

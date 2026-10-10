import { CategoryManager } from "@/components/dashboard/CategoryManager";
import { listCategories } from "@/server/repositories/categories";

export default async function CategoriesPage() {
  const categories = await listCategories();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">Categories</h1>
        <p className="text-gray-500 mt-1 text-sm">
          Content sections shown to readers.
        </p>
      </div>
      <CategoryManager initialCategories={categories} />
    </div>
  );
}

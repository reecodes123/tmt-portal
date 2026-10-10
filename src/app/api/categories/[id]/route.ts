import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canManageCategories } from "@/server/permissions";
import { deleteCategory, getCategoryById, updateCategory } from "@/server/repositories/categories";
import { updateCategorySchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageCategories(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const body = await parseJson(request, updateCategorySchema);
    const updated = await updateCategory(id, body);
    void recordActivity({
      actorId: user.id,
      action: "category.update",
      targetType: "category",
      targetId: id,
      summary: `Updated category "${updated.name}"`,
    });
    return updated;
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageCategories(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const existing = await getCategoryById(id);
    await deleteCategory(id);
    void recordActivity({
      actorId: user.id,
      action: "category.delete",
      targetType: "category",
      targetId: id,
      summary: `Deleted category "${existing?.name ?? id}"`,
    });
  });
}

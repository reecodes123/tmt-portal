import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canManageCategories } from "@/server/permissions";
import { createCategory, listCategories } from "@/server/repositories/categories";
import { createCategorySchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Public list — categories power the public site navigation. */
export async function GET() {
  return handle(() => listCategories());
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageCategories(user)) {
      throw new AuthError("You cannot manage categories.", 403);
    }
    const body = await parseJson(request, createCategorySchema);
    const created = await createCategory(body);
    void recordActivity({
      actorId: user.id,
      action: "category.create",
      targetType: "category",
      targetId: created.id,
      summary: `Added category "${created.name}"`,
    });
    return created;
  });
}

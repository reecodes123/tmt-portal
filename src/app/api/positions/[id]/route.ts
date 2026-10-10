import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canManageBoard } from "@/server/permissions";
import {
  deletePosition,
  getPositionById,
  updatePosition,
} from "@/server/repositories/positions";
import { updatePositionSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const body = await parseJson(request, updatePositionSchema);
    const updated = await updatePosition(id, body);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "position.update",
      targetType: "position",
      targetId: id,
      summary: `Updated position "${updated.name}"`,
    });
    return updated;
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const existing = await getPositionById(id);
    await deletePosition(id);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "position.delete",
      targetType: "position",
      targetId: id,
      summary: `Deleted position "${existing?.name ?? id}"`,
    });
  });
}

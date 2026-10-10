import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canManageBoard } from "@/server/permissions";
import {
  deleteBoardMember,
  getBoardMemberById,
  updateBoardMember,
} from "@/server/repositories/boardMembers";
import { updateBoardMemberSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const body = await parseJson(request, updateBoardMemberSchema);
    const updated = await updateBoardMember(id, body);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "board.update",
      targetType: "board_member",
      targetId: id,
      summary: `Updated board member "${updated.name}"`,
    });
    return updated;
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const existing = await getBoardMemberById(id);
    await deleteBoardMember(id);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "board.delete",
      targetType: "board_member",
      targetId: id,
      summary: `Removed board member "${existing?.name ?? id}"`,
    });
  });
}

import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canManageBoard } from "@/server/permissions";
import { createBoardMember, listBoardMembers } from "@/server/repositories/boardMembers";
import { createBoardMemberSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Read is public — the org chart shows on the public site. */
export async function GET() {
  return handle(() => listBoardMembers());
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const body = await parseJson(request, createBoardMemberSchema);
    const created = await createBoardMember(body);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "board.create",
      targetType: "board_member",
      targetId: created.id,
      summary: `Added board member "${created.name}"`,
    });
    return created;
  });
}

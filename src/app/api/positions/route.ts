import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canManageBoard } from "@/server/permissions";
import { createPosition, listPositions } from "@/server/repositories/positions";
import { createPositionSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Read is public — the dashboard's Position picker and the org chart both need it. */
export async function GET() {
  return handle(() => listPositions());
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageBoard(user)) throw new AuthError("Forbidden.", 403);
    const body = await parseJson(request, createPositionSchema);
    const created = await createPosition(body);
    revalidatePath("/editor-in-chief");
    void recordActivity({
      actorId: user.id,
      action: "position.create",
      targetType: "position",
      targetId: created.id,
      summary: `Added position "${created.name}"`,
    });
    return created;
  });
}

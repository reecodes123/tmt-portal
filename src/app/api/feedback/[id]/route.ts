import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canReadFeedback } from "@/server/permissions";
import { deleteFeedback, setFeedbackStatus } from "@/server/repositories/feedback";
import { updateFeedbackSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canReadFeedback(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    const body = await parseJson(request, updateFeedbackSchema);
    const updated = await setFeedbackStatus(id, body.status);
    void recordActivity({
      actorId: user.id,
      action: "feedback.update",
      targetType: "feedback",
      targetId: id,
      summary: `Marked feedback as ${body.status}`,
    });
    return updated;
  });
}

export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canReadFeedback(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;
    await deleteFeedback(id);
    void recordActivity({
      actorId: user.id,
      action: "feedback.delete",
      targetType: "feedback",
      targetId: id,
      summary: "Deleted a feedback message",
    });
  });
}

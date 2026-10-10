import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canReadFeedback } from "@/server/permissions";
import { createFeedback, listFeedback } from "@/server/repositories/feedback";
import { createFeedbackSchema } from "@/lib/validation";
import { handle, parseJson } from "../_helpers";

/** Read is editor/admin only; create is public (readers can submit). */
export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!canReadFeedback(user)) throw new AuthError("Forbidden.", 403);
    return listFeedback();
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const body = await parseJson(request, createFeedbackSchema);
    await createFeedback(body);
  });
}

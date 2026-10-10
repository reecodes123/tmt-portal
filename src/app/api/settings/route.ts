import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canEditSettings } from "@/server/permissions";
import { getSettings, updateSettings } from "@/server/repositories/settings";
import { updateSettingsSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Read is public — the public site fetches its branding here. */
export async function GET() {
  return handle(() => getSettings());
}

export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canEditSettings(user)) throw new AuthError("Forbidden.", 403);
    const body = await parseJson(request, updateSettingsSchema);
    const saved = await updateSettings(body);
    // Branding is consumed by the (public) layout — Header/Footer/Navigation —
    // so every public page has to be invalidated, not one route.
    revalidatePath("/", "layout");
    void recordActivity({
      actorId: user.id,
      action: "settings.update",
      targetType: "settings",
      targetId: "main",
      summary: "Updated website settings",
    });
    return saved;
  });
}

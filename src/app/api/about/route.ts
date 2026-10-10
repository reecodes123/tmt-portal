import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canEditSettings } from "@/server/permissions";
import { getAboutPage, updateAboutPage } from "@/server/repositories/aboutPage";
import { updateAboutPageSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Read is public — the About Us page fetches its content here. */
export async function GET() {
  return handle(() => getAboutPage());
}

export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canEditSettings(user)) throw new AuthError("Forbidden.", 403);
    const body = await parseJson(request, updateAboutPageSchema);
    const saved = await updateAboutPage(body);
    // Invalidate the cached public page so it reflects this save immediately
    // rather than waiting for its own next natural revalidation.
    revalidatePath("/about");
    void recordActivity({
      actorId: user.id,
      action: "about.update",
      targetType: "about_page",
      targetId: "main",
      summary: "Updated the About Us page",
    });
    return saved;
  });
}

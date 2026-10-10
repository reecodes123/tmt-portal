import type { NextRequest } from "next/server";
import { revalidatePath } from "next/cache";
import { requireUser, AuthError } from "@/server/auth";
import { canEditSettings } from "@/server/permissions";
import { getTermsPage, updateTermsPage } from "@/server/repositories/termsPage";
import { updateTermsPageSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Read is public — the Terms & Conditions page fetches its content here. */
export async function GET() {
  return handle(() => getTermsPage());
}

export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canEditSettings(user)) throw new AuthError("Forbidden.", 403);
    const body = await parseJson(request, updateTermsPageSchema);
    const saved = await updateTermsPage(body);
    // /terms shows the document; the layout-level banner reads the version,
    // so a version bump must invalidate every public page, not just /terms.
    revalidatePath("/terms");
    revalidatePath("/", "layout");
    void recordActivity({
      actorId: user.id,
      action: "terms.update",
      targetType: "terms_page",
      targetId: "main",
      summary: body.bumpVersion
        ? `Published Terms & Conditions v${saved.version} — visitors and staff will be asked to re-accept`
        : "Updated Terms & Conditions text",
    });
    return saved;
  });
}

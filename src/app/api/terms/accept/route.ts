import { requireUser } from "@/server/auth";
import { getTermsPage } from "@/server/repositories/termsPage";
import { setTermsAcceptedVersion } from "@/server/repositories/users";
import { handle } from "../../_helpers";

/**
 * Staff re-acceptance. Any signed-in editor/admin may call this — there's
 * nothing to authorize beyond "you are who your session says you are",
 * since a user can only ever accept Terms on their own behalf.
 */
export async function POST() {
  return handle(async () => {
    const user = await requireUser();
    const terms = await getTermsPage();
    await setTermsAcceptedVersion(user.id, terms.version);
    return { accepted: true, version: terms.version };
  });
}

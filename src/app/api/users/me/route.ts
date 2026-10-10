import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { updateOwnProfileSchema } from "@/lib/validation";
import { changePassword, updateOwnProfile } from "@/server/repositories/users";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../_helpers";

/**
 * Self-service profile update. Any authenticated user can hit this — no admin
 * check — but each user can only change their own record because the id
 * comes from the session, not the URL.
 */
export async function PATCH(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    const body = await parseJson(request, updateOwnProfileSchema);

    if (body.newPassword) {
      // Schema's .refine() already guarantees currentPassword is present
      // whenever newPassword is; changePassword re-verifies it server-side
      // before hashing, so a stolen session token alone can't rotate the
      // password without also knowing the current one.
      try {
        await changePassword(user.id, body.currentPassword!, body.newPassword);
      } catch (err) {
        throw new AuthError(
          err instanceof Error ? err.message : "Could not change password.",
          403
        );
      }
    }

    const updated = await updateOwnProfile(user.id, {
      displayName: body.displayName,
      avatarUrl: body.avatarUrl,
    });
    void recordActivity({
      actorId: user.id,
      action: "user.update",
      targetType: "user",
      targetId: user.id,
      summary: body.newPassword
        ? "Updated own profile and changed password"
        : "Updated own profile",
    });
    return updated;
  });
}

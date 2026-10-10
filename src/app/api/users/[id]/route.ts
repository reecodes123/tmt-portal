import type { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth";
import {
  deleteUserPermanently,
  getUserById,
  updateUser,
} from "@/server/repositories/users";
import { updateUserSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { ConflictError, handle, parseJson } from "../../_helpers";

interface RouteContext { params: Promise<{ id: string }>; }

export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const body = await parseJson(request, updateUserSchema);

    // Self-protection: an admin can fully manage every OTHER account, but
    // can never strip their own administrative authority through this
    // endpoint — no client-side control gates this decision, so it has to
    // be enforced here regardless of what the request body actually
    // contains (a hand-crafted PATCH included).
    if (id === admin.id) {
      if (body.role !== undefined && body.role !== "admin") {
        throw new ConflictError(
          "You cannot change your own role. Ask another administrator to do this."
        );
      }
      if (body.active === false) {
        throw new ConflictError("You cannot deactivate your own account.");
      }
    }

    const updated = await updateUser(id, body);
    void recordActivity({
      actorId: admin.id,
      action: "user.update",
      targetType: "user",
      targetId: id,
      summary: `Updated account for "${updated.displayName}"`,
    });
    return updated;
  });
}

/**
 * Genuine, permanent deletion — distinct from PATCH { active: false }
 * (deactivation), which is what the dashboard's Deactivate/Activate toggle
 * actually uses. This is the Delete action: it removes the row from MySQL.
 */
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;

    // Same unconditional self-protection as PATCH: an admin should never be
    // able to lock themselves out via this endpoint, full stop.
    if (id === admin.id) {
      throw new ConflictError("You cannot delete your own account.");
    }

    const existing = await getUserById(id);
    if (!existing) throw new ConflictError("Account not found.");

    await deleteUserPermanently(id);
    void recordActivity({
      actorId: admin.id,
      action: "user.delete",
      targetType: "user",
      targetId: id,
      summary: `Permanently deleted account for "${existing.displayName}" (${existing.email})`,
    });
  });
}

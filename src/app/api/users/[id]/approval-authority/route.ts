import type { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth";
import { setApprovalAuthority } from "@/server/repositories/users";
import { updateApprovalAuthoritySchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../../../_helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Grants or revokes delegated article-approval authority — a distinct,
 * narrower endpoint from the general PATCH /api/users/[id], and deliberately
 * so: requireAdmin() here means an editor can never reach this route at all,
 * with any payload, to grant themselves (or anyone) this capability. Only
 * the EIC can call this.
 */
export async function PATCH(request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const admin = await requireAdmin();
    const { id } = await ctx.params;
    const { canApproveArticles } = await parseJson(
      request,
      updateApprovalAuthoritySchema
    );

    const updated = await setApprovalAuthority(id, canApproveArticles);

    void recordActivity({
      actorId: admin.id,
      action: "user.update",
      targetType: "user",
      targetId: id,
      summary: canApproveArticles
        ? `Granted article-approval authority to "${updated.displayName}"`
        : `Revoked article-approval authority from "${updated.displayName}"`,
    });

    return updated;
  });
}

import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canDeleteMedia } from "@/server/permissions";
import { deleteMedia, getMediaById } from "@/server/repositories/media";
import { deleteStoredFile } from "@/server/storage";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle } from "../../_helpers";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Admin-only, matching canDeleteMedia. Editors can upload but not remove. */
export async function DELETE(_request: NextRequest, ctx: RouteContext) {
  return handle(async () => {
    const user = await requireUser();
    if (!canDeleteMedia(user)) throw new AuthError("Forbidden.", 403);
    const { id } = await ctx.params;

    const asset = await getMediaById(id);
    if (!asset) throw new AuthError("Not found.", 403);

    await deleteMedia(id);
    // Best-effort — deleteStoredFile() never throws, so a missing/already-gone
    // blob doesn't block the metadata row from being removed.
    await deleteStoredFile(asset.url);
    void recordActivity({
      actorId: user.id,
      action: "media.delete",
      targetType: "media_asset",
      targetId: id,
      summary: `Deleted "${asset.fileName}"`,
    });
  });
}

import type { NextRequest } from "next/server";
import { requireUser, AuthError } from "@/server/auth";
import { canManageMedia } from "@/server/permissions";
import {
  ALLOWED_MIME_TYPES,
  MAX_UPLOAD_BYTES,
  listMedia,
  recordUpload,
} from "@/server/repositories/media";
import { storeFile } from "@/server/storage";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle } from "../_helpers";

export async function GET() {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageMedia(user)) throw new AuthError("Forbidden.", 403);
    return listMedia();
  });
}

/**
 * Multipart upload endpoint.
 *
 * Writes to Vercel Blob when BLOB_READ_WRITE_TOKEN is set, otherwise to
 * /public/uploads for local dev — see src/server/storage.ts.
 *
 * Size and MIME are validated HERE, server-side, because anything the browser
 * checks can be bypassed by posting directly to this endpoint.
 */
export async function POST(request: NextRequest) {
  return handle(async () => {
    const user = await requireUser();
    if (!canManageMedia(user)) throw new AuthError("Forbidden.", 403);

    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new Error("No file provided.");

    if (file.size > MAX_UPLOAD_BYTES) {
      throw new Error("File is too large (10 MB max).");
    }
    if (!ALLOWED_MIME_TYPES.includes(file.type as (typeof ALLOWED_MIME_TYPES)[number])) {
      throw new Error(`Unsupported file type: ${file.type}`);
    }

    const stored = await storeFile(file, file.type);

    const created = await recordUpload({
      url: stored.url,
      fileName: file.name,
      mimeType: file.type,
      sizeBytes: file.size,
      uploadedById: user.id,
    });
    void recordActivity({
      actorId: user.id,
      action: "media.upload",
      targetType: "media_asset",
      targetId: created.id,
      summary: `Uploaded "${created.fileName}"`,
    });
    return created;
  });
}

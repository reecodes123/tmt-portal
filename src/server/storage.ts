/**
 * File storage. SERVER ONLY.
 *
 * Two backends behind one interface, chosen automatically:
 *
 *   • VERCEL BLOB — used when BLOB_READ_WRITE_TOKEN is set. Required in
 *     production: Vercel's filesystem is read-only and ephemeral, so writing
 *     to /public at runtime silently fails or vanishes on the next deploy.
 *
 *   • LOCAL DISK — used otherwise. Writes to /public/uploads so `npm run dev`
 *     works with zero setup or cloud account.
 *
 * Callers never need to know which is active.
 */

import { randomBytes } from "crypto";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

export interface StoredFile {
  url: string;
  /** Backend-specific handle, kept so the file can be deleted later. */
  pathname: string;
}

/**
 * Builds a collision-proof, path-traversal-proof storage key.
 *
 * The original filename is NEVER used directly — a user-supplied name like
 * `../../.env` or `x.png.php` is a real attack vector. The extension is
 * whitelisted against the detected MIME type rather than trusted from input.
 */
function safeKey(originalName: string, mimeType: string): string {
  const extByMime: Record<string, string> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/gif": "gif",
    "image/webp": "webp",
    "application/pdf": "pdf",
  };

  const ext = extByMime[mimeType] ?? "bin";
  const stem = path
    .basename(originalName, path.extname(originalName))
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "file";

  const stamp = new Date().toISOString().slice(0, 10);
  const nonce = randomBytes(6).toString("hex");

  return `${stamp}-${stem}-${nonce}.${ext}`;
}

/** True when a real blob store is configured. */
export function usingBlobStorage(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

export async function storeFile(
  file: File,
  mimeType: string
): Promise<StoredFile> {
  // Fail loudly and immediately in production rather than silently falling
  // through to the local-disk branch below: Vercel's filesystem is read-only
  // outside /tmp, so that write would otherwise fail with an opaque EROFS-style
  // error (or, worse, land somewhere that looks like it worked and then loses
  // the file on the next cold start/deploy) — see the 2026 pre-deployment
  // audit. This is the one thing this module cannot fix in code: a Blob store
  // has to be provisioned and BLOB_READ_WRITE_TOKEN set in the deployment's
  // environment variables before the first upload in production.
  if (process.env.NODE_ENV === "production" && !usingBlobStorage()) {
    throw new Error(
      "Image/file storage is not configured for production. Set BLOB_READ_WRITE_TOKEN " +
        "(Vercel dashboard → Project → Storage → Blob) before uploading — local-disk " +
        "storage does not persist on Vercel's serverless filesystem."
    );
  }

  const key = safeKey(file.name, mimeType);
  const bytes = Buffer.from(await file.arrayBuffer());

  if (usingBlobStorage()) {
    // Imported lazily so the package is only needed when actually used —
    // local dev doesn't have to install it.
    const { put } = await import("@vercel/blob");
    const blob = await put(`media/${key}`, bytes, {
      access: "public",
      contentType: mimeType,
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    return { url: blob.url, pathname: blob.pathname };
  }

  const uploadDir = path.join(process.cwd(), "public", "uploads");
  await mkdir(uploadDir, { recursive: true });
  await writeFile(path.join(uploadDir, key), bytes);

  // Served straight from /public by Next.
  return { url: `/uploads/${key}`, pathname: `uploads/${key}` };
}

/**
 * Best-effort delete. Never throws: a missing file shouldn't block removing
 * the database row, or the library would show entries that can't be cleared.
 */
export async function deleteStoredFile(url: string): Promise<void> {
  try {
    if (usingBlobStorage() && url.startsWith("http")) {
      const { del } = await import("@vercel/blob");
      await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
      return;
    }

    if (url.startsWith("/uploads/")) {
      const { unlink } = await import("fs/promises");
      await unlink(path.join(process.cwd(), "public", url.replace(/^\//, "")));
    }
  } catch (error) {
    console.error("Failed to delete stored file:", url, error);
  }
}

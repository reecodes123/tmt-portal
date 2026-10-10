/**
 * Media library. SERVER ONLY.
 *
 * This layer records METADATA only. The bytes live in whatever blob store the
 * upload route writes to (Vercel Blob in production, /public/uploads in local
 * dev) — see src/app/api/media/route.ts.
 */

import { prisma } from "@/server/db";
import type { MediaAsset } from "@/types/domain";
import { ConflictError } from "@/app/api/_helpers";
import { toMediaAsset } from "./_mappers";

/** Enforced server-side, not just in the file picker. */
export const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;

export const MAX_UPLOAD_BYTES = 10 * 1024 * 1024; // 10 MB

export async function listMedia(): Promise<MediaAsset[]> {
  const rows = await prisma.mediaAsset.findMany({
    orderBy: { createdAt: "desc" },
    include: { uploadedBy: { select: { displayName: true } } },
  });
  return rows.map(toMediaAsset);
}

export async function getMediaById(id: string): Promise<MediaAsset | null> {
  const row = await prisma.mediaAsset.findUnique({
    where: { id },
    include: { uploadedBy: { select: { displayName: true } } },
  });
  return row ? toMediaAsset(row) : null;
}

export async function recordUpload(input: {
  url: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  uploadedById: string;
}): Promise<MediaAsset> {
  const row = await prisma.mediaAsset.create({
    data: input,
    include: { uploadedBy: { select: { displayName: true } } },
  });
  return toMediaAsset(row);
}

/**
 * Removes the metadata row (the caller — DELETE /api/media/[id] — also
 * deletes the underlying file via server/storage.ts's deleteStoredFile()).
 *
 * Blocks the delete if the asset's URL is still used as an article's cover
 * image or embedded in its body — coverImageUrl/contentImageUrls are plain
 * URL strings, not a foreign key to MediaAsset, so nothing in the schema
 * would otherwise stop this from silently breaking a live article's image.
 */
export async function deleteMedia(id: string): Promise<void> {
  const asset = await prisma.mediaAsset.findUnique({
    where: { id },
    select: { url: true },
  });
  if (!asset) return;

  const [coverUsage, contentUsage] = await Promise.all([
    prisma.article.count({ where: { coverImageUrl: asset.url } }),
    prisma.article.count({ where: { contentImageUrls: { array_contains: asset.url } } }),
  ]);
  const usageCount = coverUsage + contentUsage;

  if (usageCount > 0) {
    throw new ConflictError(
      `This image is used in ${usageCount} article${usageCount === 1 ? "" : "s"}. Remove it from ${usageCount === 1 ? "that article" : "those articles"} first.`
    );
  }

  await prisma.mediaAsset.delete({ where: { id } });
}

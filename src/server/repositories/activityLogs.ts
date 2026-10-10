/**
 * Audit trail + article revision history. SERVER ONLY.
 *
 * Required by the project proposal ("a detailed version history and audit
 * trail of all modifications ... and the ability to revert changes") and
 * implemented by neither prototype.
 */

import { prisma } from "@/server/db";
import type { ActivityAction, ActivityLog } from "@/types/domain";
import { toActivityLog } from "./_mappers";

export interface RecordActivityInput {
  actorId: string;
  action: ActivityAction;
  targetType: string;
  targetId?: string | null;
  summary: string;
}

/**
 * Never throws. An audit write failing must not roll back the user's actual
 * work — losing a log line is bad, losing their article is worse.
 */
export async function recordActivity(input: RecordActivityInput): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        actorId: input.actorId,
        action: input.action,
        targetType: input.targetType,
        targetId: input.targetId ?? null,
        summary: input.summary,
      },
    });
  } catch (error) {
    console.error("Failed to write activity log:", error);
  }
}

export async function listActivityLogs(limit = 100): Promise<ActivityLog[]> {
  const rows = await prisma.activityLog.findMany({
    orderBy: { createdAt: "desc" },
    take: Math.min(500, limit),
    include: { actor: { select: { displayName: true } } },
  });
  return rows.map(toActivityLog);
}

export async function listArticleRevisions(articleId: string) {
  const rows = await prisma.articleRevision.findMany({
    where: { articleId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return rows.map((r) => ({
    id: r.id,
    articleId: r.articleId,
    title: r.title,
    excerpt: r.excerpt,
    content: r.content,
    status: r.status,
    editedById: r.editedById,
    editedByName: r.editedByName,
    createdAt: r.createdAt.toISOString(),
  }));
}

/**
 * Restores an article to a previous revision.
 *
 * Snapshots the CURRENT state first, so reverting is itself undoable — a
 * mis-click shouldn't destroy the version you were on.
 */
export async function revertArticleToRevision(
  articleId: string,
  revisionId: string
): Promise<void> {
  const revision = await prisma.articleRevision.findUnique({
    where: { id: revisionId },
  });
  if (!revision || revision.articleId !== articleId) {
    throw new Error("Revision not found for this article.");
  }

  const current = await prisma.article.findUnique({
    where: { id: articleId },
    select: { title: true, excerpt: true, content: true, status: true },
  });
  if (!current) throw new Error("Article not found.");

  await prisma.$transaction([
    prisma.articleRevision.create({
      data: {
        articleId,
        title: current.title,
        excerpt: current.excerpt,
        content: current.content,
        status: current.status,
        editedById: "system",
        editedByName: "system (pre-revert snapshot)",
      },
    }),
    prisma.article.update({
      where: { id: articleId },
      data: {
        title: revision.title,
        excerpt: revision.excerpt,
        content: revision.content,
        status: revision.status,
      },
    }),
  ]);
}

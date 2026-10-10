/**
 * Reader feedback. SERVER ONLY.
 * Anyone may submit; only editors/admins may read or manage.
 */

import { prisma } from "@/server/db";
import type { Feedback, FeedbackStatus } from "@/types/domain";
import type { CreateFeedbackBody } from "@/types/api";
import { toFeedback } from "./_mappers";

export async function listFeedback(): Promise<Feedback[]> {
  const rows = await prisma.feedback.findMany({
    orderBy: { submittedAt: "desc" },
  });
  return rows.map(toFeedback);
}

export async function createFeedback(
  input: CreateFeedbackBody
): Promise<Feedback> {
  const row = await prisma.feedback.create({
    data: { message: input.message, name: input.name ?? null },
  });
  return toFeedback(row);
}

export async function setFeedbackStatus(
  id: string,
  status: FeedbackStatus
): Promise<Feedback> {
  const row = await prisma.feedback.update({ where: { id }, data: { status } });
  return toFeedback(row);
}

export async function deleteFeedback(id: string): Promise<void> {
  await prisma.feedback.delete({ where: { id } });
}

export async function countUnreadFeedback(): Promise<number> {
  return prisma.feedback.count({ where: { status: "unread" } });
}

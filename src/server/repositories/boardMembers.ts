/**
 * Editorial board (org chart) data access. SERVER ONLY.
 *
 * Deliberately separate from `users.ts`: most board members — student
 * writers, cartoonists, photojournalists — never need a dashboard login, and
 * some dashboard accounts aren't public-facing board members.
 *
 * Every member is linked to a Position (see positions.ts), which is what
 * actually determines their tier/level on the org chart — a member's tier is
 * never set directly, so it can't disagree with its title.
 */

import { prisma } from "@/server/db";
import type { BoardMember } from "@/types/domain";
import type {
  CreateBoardMemberBody,
  UpdateBoardMemberBody,
} from "@/types/api";
import { toBoardMember } from "./_mappers";

const withPosition = { position: true } as const;

export async function listBoardMembers(): Promise<BoardMember[]> {
  const rows = await prisma.boardMember.findMany({
    include: withPosition,
    orderBy: [
      { position: { tier: "asc" } },
      { position: { sortOrder: "asc" } },
      { sortOrder: "asc" },
      { name: "asc" },
    ],
  });
  return rows.map(toBoardMember);
}

export async function getBoardMemberById(
  id: string
): Promise<BoardMember | null> {
  const row = await prisma.boardMember.findUnique({
    where: { id },
    include: withPosition,
  });
  return row ? toBoardMember(row) : null;
}

export async function createBoardMember(
  input: CreateBoardMemberBody
): Promise<BoardMember> {
  const row = await prisma.boardMember.create({
    data: {
      name: input.name,
      positionId: input.positionId,
      description: input.description ?? null,
      imageUrl: input.imageUrl ?? null,
      sortOrder: input.sortOrder ?? 0,
      userId: input.userId ?? null,
    },
    include: withPosition,
  });
  return toBoardMember(row);
}

export async function updateBoardMember(
  id: string,
  input: UpdateBoardMemberBody
): Promise<BoardMember> {
  const row = await prisma.boardMember.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.positionId !== undefined ? { positionId: input.positionId } : {}),
      ...(input.description !== undefined
        ? { description: input.description ?? null }
        : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl ?? null } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
      ...(input.userId !== undefined ? { userId: input.userId ?? null } : {}),
    },
    include: withPosition,
  });
  return toBoardMember(row);
}

export async function deleteBoardMember(id: string): Promise<void> {
  await prisma.boardMember.delete({ where: { id } });
}

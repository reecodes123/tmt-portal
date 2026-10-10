/**
 * Editorial position catalog. SERVER ONLY.
 *
 * Admin-manageable so titles ("Managing Editor", "Lead Photojournalist")
 * come from a controlled list instead of free text — see Position's schema
 * comment for why. `tier` is what drives grouping/order on the public org
 * chart; BoardMember never sets a tier directly.
 */

import { prisma } from "@/server/db";
import type { Position } from "@/types/domain";
import type { CreatePositionBody, UpdatePositionBody } from "@/types/api";
import { ConflictError } from "@/app/api/_helpers";
import { toDbTier, toPosition } from "./_mappers";

export async function listPositions(): Promise<Position[]> {
  const rows = await prisma.position.findMany({
    orderBy: [{ tier: "asc" }, { sortOrder: "asc" }, { name: "asc" }],
  });
  return rows.map(toPosition);
}

export async function getPositionById(id: string): Promise<Position | null> {
  const row = await prisma.position.findUnique({ where: { id } });
  return row ? toPosition(row) : null;
}

export async function createPosition(
  input: CreatePositionBody
): Promise<Position> {
  const row = await prisma.position.create({
    data: {
      name: input.name,
      tier: toDbTier(input.tier) as never,
      sortOrder: input.sortOrder ?? 0,
    },
  });
  return toPosition(row);
}

export async function updatePosition(
  id: string,
  input: UpdatePositionBody
): Promise<Position> {
  const row = await prisma.position.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.tier !== undefined ? { tier: toDbTier(input.tier) as never } : {}),
      ...(input.sortOrder !== undefined ? { sortOrder: input.sortOrder } : {}),
    },
  });
  return toPosition(row);
}

/**
 * Deleting a position that's still assigned to a board member would orphan
 * them, and the FK is effectively Restrict anyway. Check first so the Admin
 * gets a sentence instead of a raw constraint violation.
 */
export async function deletePosition(id: string): Promise<void> {
  const memberCount = await prisma.boardMember.count({
    where: { positionId: id },
  });

  if (memberCount > 0) {
    throw new ConflictError(
      `${memberCount} board member${memberCount === 1 ? " has" : "s have"} this position. Reassign them first.`
    );
  }

  await prisma.position.delete({ where: { id } });
}

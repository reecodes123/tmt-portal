import type { NextRequest } from "next/server";
import { requireAdmin } from "@/server/auth";
import { createUser, listUsers } from "@/server/repositories/users";
import { createUserSchema } from "@/lib/validation";
import { recordActivity } from "@/server/repositories/activityLogs";
import { handle, parseJson } from "../_helpers";

/** Admin-only for both list and create. */
export async function GET() {
  return handle(async () => {
    await requireAdmin();
    return listUsers();
  });
}

export async function POST(request: NextRequest) {
  return handle(async () => {
    const admin = await requireAdmin();
    const body = await parseJson(request, createUserSchema);
    const created = await createUser(body);
    void recordActivity({
      actorId: admin.id,
      action: "user.create",
      targetType: "user",
      targetId: created.id,
      summary: `Created ${created.role} account for "${created.displayName}" (${created.email})`,
    });
    return created;
  });
}

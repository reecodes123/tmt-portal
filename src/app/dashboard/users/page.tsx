import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { UsersManager } from "@/components/dashboard/UsersManager";
import { listUsers } from "@/server/repositories/users";

/** Admin-only. */
export default async function UsersPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  const users = await listUsers();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy">Users</h1>
      <UsersManager initialUsers={users} viewerId={user.id} />
    </div>
  );
}

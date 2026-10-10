import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { SettingsForm } from "@/components/dashboard/SettingsForm";
import { getSettings } from "@/server/repositories/settings";

/** Admin-only. */
export default async function SettingsPage() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  const settings = await getSettings();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        Website Settings
      </h1>
      <SettingsForm initialSettings={settings} />
    </div>
  );
}

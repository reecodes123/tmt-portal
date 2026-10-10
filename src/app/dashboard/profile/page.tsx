import { ProfileForm } from "@/components/dashboard/ProfileForm";
import { getCurrentUser } from "@/server/auth";

export default async function ProfilePage() {
  const user = await getCurrentUser();
  if (!user) return null;

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        Your Profile
      </h1>
      <ProfileForm user={user} />
    </div>
  );
}

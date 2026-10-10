import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { AboutPageEditor } from "@/components/dashboard/AboutPageEditor";
import { getAboutPage } from "@/server/repositories/aboutPage";

/** Admin-only, matching Settings' precedent for site-wide official content. */
export default async function AboutPageDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  const page = await getAboutPage();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        About Us Page
      </h1>
      <AboutPageEditor initialPage={page} />
    </div>
  );
}

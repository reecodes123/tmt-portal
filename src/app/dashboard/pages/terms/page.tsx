import { redirect } from "next/navigation";
import { getCurrentUser } from "@/server/auth";
import { TermsPageEditor } from "@/components/dashboard/TermsPageEditor";
import { getTermsPage } from "@/server/repositories/termsPage";

/** Admin-only, matching Settings' precedent for site-wide official content. */
export default async function TermsPageDashboard() {
  const user = await getCurrentUser();
  if (!user) return null;
  if (user.role !== "admin") redirect("/dashboard");

  const page = await getTermsPage();

  return (
    <div>
      <h1 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-6">
        Terms &amp; Conditions
      </h1>
      <TermsPageEditor initialPage={page} />
    </div>
  );
}

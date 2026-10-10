import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/LoginForm";
import { getCurrentUser } from "@/server/auth";

export const metadata: Metadata = {
  title: "Editorial Sign In",
  description:
    "Sign in to The Matrix Today editorial portal — the official student publication of the College of Engineering, Marinduque State University.",
  // Keep the login page out of search results. Note: discoverability, not
  // security — the route is protected by authentication, not obscurity.
  robots: { index: false, follow: false },
};

export default async function LoginPage() {
  // Already signed in? Don't show the form again.
  const user = await getCurrentUser();
  if (user) redirect("/dashboard");

  return (
    // LoginForm calls useSearchParams() to honour a ?from= redirect target.
    // In the App Router that has to sit inside a Suspense boundary, otherwise
    // the whole route is forced out of static rendering and the build errors.
    <Suspense fallback={<div className="min-h-screen bg-tmt-cream-warm" />}>
      <LoginForm />
    </Suspense>
  );
}

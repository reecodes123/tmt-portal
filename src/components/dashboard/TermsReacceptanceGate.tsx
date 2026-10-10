"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { acceptTerms } from "@/lib/api-client";

interface Props {
  version: number;
  content: string;
}

/**
 * Blocks the dashboard's main content when the Admin/EIC has published a
 * substantially updated Terms & Conditions (a version bump). Rendered by
 * dashboard/layout.tsx IN PLACE of `children` — deliberately not a separate
 * route — so there's no redirect loop to guard against; the Sidebar still
 * renders underneath so a blocked user can still sign out.
 */
export function TermsReacceptanceGate({ version, content }: Props) {
  const router = useRouter();
  const [accepting, setAccepting] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    setAccepting(true);
    setError("");
    try {
      await acceptTerms();
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not record acceptance.");
      setAccepting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-xl shadow-md p-6 sm:p-8">
        <h1 className="text-xl sm:text-2xl font-bold text-tmt-navy mb-2">
          Terms &amp; Conditions Updated
        </h1>
        <p className="text-sm text-gray-500 mb-6">
          The Editor-in-Chief has published an updated Terms &amp; Conditions
          (version {version}). Please review and accept before continuing.
        </p>
        <div
          className="prose prose-sm sm:prose-base max-w-none text-gray-700 border border-gray-100 rounded-lg p-4 sm:p-6 max-h-96 overflow-y-auto mb-6"
          dangerouslySetInnerHTML={{ __html: content }}
        />
        {error && (
          <p role="alert" className="text-sm text-red-600 mb-4">
            {error}
          </p>
        )}
        <button
          onClick={handleAccept}
          disabled={accepting}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors disabled:opacity-60"
        >
          {accepting && <Loader2 size={16} className="animate-spin" />}
          I Agree — Continue
        </button>
      </div>
    </div>
  );
}

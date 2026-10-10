"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

/**
 * Global error boundary.
 *
 * Shows a friendly message and never leaks stack traces or system internals to
 * the reader — a non-functional requirement from the project proposal that
 * neither prototype satisfied.
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // TODO(backend): forward to a logging service.
    console.error(error);
  }, [error]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tmt-cream px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tmt-navy text-tmt-orange-light mb-6">
        <AlertTriangle size={30} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-tmt-navy mb-3">
        Something went wrong
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        We hit an unexpected problem loading this page. Please try again — if it
        keeps happening, let the editorial team know.
      </p>
      <button
        onClick={reset}
        className="px-6 py-3 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors"
      >
        Try again
      </button>
    </div>
  );
}

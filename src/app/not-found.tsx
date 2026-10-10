import Link from "next/link";
import { FileQuestion } from "lucide-react";

/** Global 404. Neither prototype handled unknown routes at all. */
export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-tmt-cream px-4 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tmt-navy text-tmt-orange-light mb-6">
        <FileQuestion size={30} />
      </div>
      <h1 className="text-3xl sm:text-4xl font-bold text-tmt-navy mb-3">
        Page not found
      </h1>
      <p className="text-gray-600 max-w-md mb-8">
        The page you&apos;re looking for doesn&apos;t exist, or it may have been
        moved or unpublished.
      </p>
      <Link
        href="/"
        className="px-6 py-3 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light text-white font-semibold transition-colors"
      >
        Back to the homepage
      </Link>
    </div>
  );
}

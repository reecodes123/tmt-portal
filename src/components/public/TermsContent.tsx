import { FileText } from "lucide-react";
import type { TermsPage } from "@/types/domain";

interface Props {
  page: TermsPage;
}

/**
 * Renders the Terms & Conditions page from `TermsPage` (DB-backed,
 * dashboard-editable at /dashboard/pages/terms). The document itself is one
 * rich-text block — the previous five icon-cards are replaced by ordinary
 * headings/paragraphs inside the same styled wrapper, which reads more
 * naturally as a legal document and keeps the model a single editable field.
 */
export function TermsContent({ page }: Props) {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-16">
      {/* Header */}
      <div className="mb-10 sm:mb-12 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-tmt-navy text-tmt-orange-light mb-5">
          <FileText size={30} />
        </div>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-tmt-navy mb-4">
          Terms and Conditions
        </h1>
        <div className="h-1 w-24 bg-gradient-to-r from-tmt-orange to-tmt-orange-light mx-auto mt-6 rounded-full" />
      </div>

      {/* Document */}
      <div
        className="bg-white rounded-xl shadow-md p-6 sm:p-8 prose prose-sm sm:prose-base max-w-none text-gray-700 prose-headings:text-tmt-navy prose-headings:font-bold prose-h2:text-lg sm:prose-h2:text-xl [&_p]:leading-relaxed"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />

      {/* Acknowledgement */}
      <div className="mt-10 sm:mt-12 bg-tmt-navy text-white rounded-xl p-6 sm:p-8 text-center">
        <p className="leading-relaxed">
          By continuing to use The Matrix Today Portal, you acknowledge that you have
          read, understood, and agreed to these Terms and Conditions.
        </p>
      </div>
    </div>
  );
}

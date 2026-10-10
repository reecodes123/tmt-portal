"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { X } from "lucide-react";

export const PRIVACY_ACK_KEY = "tmt_privacy_ack";
/** Fired on dismissal so other fixed-bottom banners (e.g. TermsAcceptanceBanner) can queue behind this one instead of stacking. */
export const PRIVACY_ACK_EVENT = "tmt:privacy-ack";
const ACK_KEY = PRIVACY_ACK_KEY;

/**
 * Data Privacy Act (RA 10173) notice.
 *
 * Required by the project proposal — "the system complies ... by displaying a
 * notice upon website access informing readers that minimal information may be
 * collected" — and missing from both prototypes.
 *
 * This is a notice, not a consent gate: we store no personal data on readers,
 * so there is nothing to consent to. Bookmarks and likes stay in the reader's
 * own browser.
 */
export function PrivacyNotice() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!window.localStorage.getItem(ACK_KEY)) setVisible(true);
  }, []);

  const dismiss = () => {
    window.localStorage.setItem(ACK_KEY, "1");
    window.dispatchEvent(new Event(PRIVACY_ACK_EVENT));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Privacy notice"
      className="fixed bottom-0 inset-x-0 z-40 bg-tmt-navy text-white px-4 py-4 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm text-gray-200 flex-1">
          We don&apos;t collect personal information from readers. Your bookmarks
          and likes are saved in this browser only, and we count visits without
          identifying anyone.{" "}
          <Link href="/terms" className="underline hover:text-tmt-orange-light">
            Read our terms
          </Link>
          .
        </p>
        <button
          onClick={dismiss}
          className="shrink-0 px-4 py-2 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light font-semibold text-sm transition-colors"
        >
          Got it
        </button>
        <button
          onClick={dismiss}
          aria-label="Dismiss privacy notice"
          className="sm:hidden absolute top-2 right-2 p-1"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
}

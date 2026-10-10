"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PRIVACY_ACK_EVENT, PRIVACY_ACK_KEY } from "./PrivacyNotice";

const STORAGE_KEY = "tmt_terms_accepted_version";

interface Props {
  version: number;
}

/**
 * Site-wide first-visit "I Agree" prompt for Terms & Conditions.
 *
 * Public readers have no accounts, so acceptance lives in the browser's
 * localStorage only — no DB record is created for them (mirrors the
 * existing useLocalBookmarks/useLocalLikes pattern already used for
 * anonymous readers). Tied to TermsPage.version, so a substantial edit
 * (admin checked "publish as a new version") re-prompts returning visitors.
 *
 * Queued behind PrivacyNotice via a shared ack event, rather than polling,
 * so the two fixed-bottom bars never render stacked on top of each other.
 */
export function TermsAcceptanceBanner({ version }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const check = () => {
      const privacyAcked = Boolean(window.localStorage.getItem(PRIVACY_ACK_KEY));
      const accepted = window.localStorage.getItem(STORAGE_KEY);
      setVisible(privacyAcked && accepted !== String(version));
    };
    check();
    window.addEventListener(PRIVACY_ACK_EVENT, check);
    return () => window.removeEventListener(PRIVACY_ACK_EVENT, check);
  }, [version]);

  const accept = () => {
    window.localStorage.setItem(STORAGE_KEY, String(version));
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Terms and Conditions acceptance"
      className="fixed bottom-0 inset-x-0 z-40 bg-tmt-orange text-white px-4 py-4 shadow-2xl"
    >
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center gap-3">
        <p className="text-sm flex-1">
          By using this site, you agree to our{" "}
          <Link href="/terms" className="underline font-semibold hover:text-tmt-navy">
            Terms and Conditions
          </Link>
          .
        </p>
        <button
          onClick={accept}
          className="shrink-0 px-4 py-2 rounded-lg bg-tmt-navy hover:bg-tmt-navy-light font-semibold text-sm transition-colors"
        >
          I Agree
        </button>
      </div>
    </div>
  );
}

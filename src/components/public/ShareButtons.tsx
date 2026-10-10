"use client";

import { Facebook, Link2, Check } from "lucide-react";
import { useState } from "react";
import { XIcon } from "./XIcon";

interface Props {
  title: string;
  slug: string;
}

/**
 * Social sharing.
 *
 * A stated functional requirement ("the platform supports sharing published
 * content to major social platforms") that neither prototype implemented.
 *
 * Note on Instagram: it has no public web share-intent URL, so a direct share
 * button isn't possible. Copy-link covers that case — the same approach most
 * publications take.
 */
export function ShareButtons({ title, slug }: Props) {
  const [copied, setCopied] = useState(false);

  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/articles/${slug}`
      : `/articles/${slug}`;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* clipboard unavailable */
    }
  };

  const share = (target: "facebook" | "x") => {
    const encoded = encodeURIComponent(url);
    const text = encodeURIComponent(title);
    const href =
      target === "facebook"
        ? `https://www.facebook.com/sharer/sharer.php?u=${encoded}`
        : `https://x.com/intent/tweet?url=${encoded}&text=${text}`;
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  return (
    <div className="flex flex-wrap items-center gap-3 mt-6">
      <span className="text-sm font-semibold text-gray-500">Share:</span>

      <button
        onClick={() => share("facebook")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        aria-label="Share on Facebook"
      >
        <Facebook size={16} />
        Facebook
      </button>

      <button
        onClick={() => share("x")}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        aria-label="Share on X"
      >
        <XIcon size={16} />X
      </button>

      <button
        onClick={copy}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium transition-colors"
        aria-label="Copy link to this article"
      >
        {copied ? <Check size={16} /> : <Link2 size={16} />}
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}

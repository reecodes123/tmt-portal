/**
 * Client-side HTML sanitization for the article Preview only. CLIENT ONLY.
 *
 * This is NOT the same implementation as server/sanitize.ts's
 * sanitizeRichText() — importing that file (built on the `sanitize-html`
 * npm package) into a "use client" component was tried first and made the
 * production build hang for several minutes instead of the usual ~20s;
 * `sanitize-html` pulls in a dependency tree (htmlparser2, deepmerge, etc.)
 * that isn't meant for a browser bundle. This file uses the browser's own
 * native `DOMParser` instead — zero new dependencies, and it never leaves
 * the browser.
 *
 * The allowlist below is kept identical in shape and intent to
 * server/sanitize.ts's ALLOWED_TAGS/allowedAttributes/allowedSchemes — if
 * that config ever changes, mirror the change here too. The actual SAVE
 * path is completely untouched and still runs through server/sanitize.ts on
 * write, independent of this; this function only affects what's rendered in
 * the live, unsaved Preview.
 */

const ALLOWED_TAGS = new Set([
  "P", "BR", "B", "STRONG", "I", "EM", "U", "S",
  "H1", "H2", "H3", "H4",
  "BLOCKQUOTE", "UL", "OL", "LI",
  "A", "IMG",
]);

/** Tags whose content (not just the tag) must never survive — matches
 * sanitize-html's default treatment of genuinely dangerous elements. */
const STRIP_WITH_CONTENT = new Set(["SCRIPT", "STYLE", "IFRAME", "OBJECT", "EMBED", "SVG"]);

const ALLOWED_SCHEMES = new Set(["http:", "https:", "mailto:"]);

function isSchemeAllowed(url: string): boolean {
  try {
    // A base is required for relative-looking strings to parse at all; a
    // genuinely relative URL from a pasted link is not something
    // RichTextEditor's own link tool ever produces, so treating it as
    // resolved-against-this-page (and then checking the resulting scheme)
    // is a safe, conservative default.
    const parsed = new URL(url, window.location.origin);
    return ALLOWED_SCHEMES.has(parsed.protocol);
  } catch {
    return false;
  }
}

function sanitizeElement(el: Element): Node[] {
  const tag = el.tagName;

  if (STRIP_WITH_CONTENT.has(tag)) return [];

  const sanitizedChildren = Array.from(el.childNodes).flatMap((child) =>
    child.nodeType === Node.ELEMENT_NODE
      ? sanitizeElement(child as Element)
      : [child.cloneNode(true)]
  );

  if (!ALLOWED_TAGS.has(tag)) {
    // Disallowed but harmless tag (e.g. a pasted <div>/<span>) — unwrap it,
    // keeping its sanitized text/inline content, matching sanitize-html's
    // default behaviour for non-dangerous unknown tags.
    return sanitizedChildren;
  }

  const clean = document.createElement(tag.toLowerCase());
  for (const child of sanitizedChildren) clean.appendChild(child);

  if (tag === "A") {
    const href = el.getAttribute("href");
    if (href && isSchemeAllowed(href)) {
      clean.setAttribute("href", href);
      clean.setAttribute("target", "_blank");
      clean.setAttribute("rel", "noopener noreferrer");
    }
  } else if (tag === "IMG") {
    const src = el.getAttribute("src");
    if (src && isSchemeAllowed(src)) clean.setAttribute("src", src);
    const alt = el.getAttribute("alt");
    if (alt) clean.setAttribute("alt", alt);
  }
  // No other tag keeps any attribute — this is what strips onclick/onerror/
  // style/class/etc. from every element without needing an explicit
  // per-attribute denylist.

  return [clean];
}

export function sanitizeRichTextForPreview(html: string): string {
  if (typeof window === "undefined") return "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const container = document.createElement("div");
  for (const node of Array.from(doc.body.childNodes)) {
    const sanitized =
      node.nodeType === Node.ELEMENT_NODE
        ? sanitizeElement(node as Element)
        : [node.cloneNode(true)];
    for (const n of sanitized) container.appendChild(n);
  }
  return container.innerHTML;
}

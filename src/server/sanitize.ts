/**
 * Server-side HTML sanitization for rich-text saves. SERVER ONLY.
 *
 * Every rich-text field (Article.content, AboutPage.overview,
 * TermsPage.content) is edited via RichTextEditor's contentEditable +
 * execCommand, then stored as raw HTML. Without this, a compromised or
 * malicious editor/admin account could inject a <script>/onerror/etc. that
 * runs in every visitor's browser — this was an open TODO in the original
 * code (see articles/[slug]/page.tsx's dangerouslySetInnerHTML comment).
 *
 * Sanitizing on WRITE (here) rather than only at render time is deliberate:
 * render-time-only sanitization is easy to forget on some future page that
 * reads the same field, so the stored value itself must already be safe.
 */

import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "p", "br", "b", "strong", "i", "em", "u", "s",
  "h1", "h2", "h3", "h4",
  "blockquote", "ul", "ol", "li",
  "a", "img",
];

export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ["href", "target", "rel"],
      img: ["src", "alt"],
    },
    // Only allow the schemes RichTextEditor's own link/image insertion can
    // produce — blocks javascript:/data: URIs, the classic XSS vector here.
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer" }),
    },
  });
}

import type { Metadata, Viewport } from "next";

/**
 * Fonts.
 *
 * Inter is loaded from `@fontsource/inter` — the font ships as an npm package,
 * so the production build needs no outbound network access. This matters for
 * CI/offline builds; `next/font/google` fetches from fonts.googleapis.com at
 * build time and hard-fails when that's unreachable.
 *
 * The family is wired to Tailwind's `font-sans` in `tailwind.config.ts`, so
 * every component picks it up automatically. Same family across the public
 * site, dashboard, and auth pages — nothing ever falls back to a serif.
 *
 * If you'd rather self-host via Next's optimizer on Vercel, swap to:
 *   import { Inter } from "next/font/google";
 *   const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
 * and add `className={inter.variable}` to <html>.
 */
import "@fontsource/inter/300.css";
import "@fontsource/inter/400.css";
import "@fontsource/inter/500.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "@fontsource/inter/800.css";

import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"
  ),
  title: {
    default: "The Matrix Today",
    template: "%s | The Matrix Today",
  },
  description:
    "The official student publication of Marinduque State University — College of Engineering.",
  openGraph: {
    siteName: "The Matrix Today",
    type: "website",
    locale: "en_PH",
  },
  robots: { index: true, follow: true },
};

/**
 * Without this, the app has no <meta name="viewport"> at all — mobile
 * browsers then render at a virtual desktop-width viewport (~980px) and zoom
 * to fit, so every `sm:`/`md:`/`lg:` Tailwind breakpoint in the app never
 * actually triggers on a real phone screen, no matter how correct the
 * responsive classes are. This is the root fix that makes those breakpoints
 * apply at all on mobile.
 */
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}

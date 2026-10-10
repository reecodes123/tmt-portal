"use client";

import { useState, type FormEvent } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Shield,
  PenLine,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { DecorativeGear } from "@/components/public/DecorativeGear";

/**
 * Editorial sign-in form for The Matrix Today.
 *
 * VISUAL DESIGN ONLY — this file was redesigned to actually reuse the public
 * site's real design language instead of a bespoke "auth product" look:
 *   - Hero gradient: the exact `from-tmt-cream via-tmt-orange to-tmt-navy`
 *     diagonal sweep Header.tsx uses for every public page's banner.
 *   - Palette: the real v1 tokens (`tmt-orange` #FF7D00, `tmt-navy` #062F3D,
 *     `tmt-cream` #FFFCEE) that Header/Nav/Footer/ArticleCard all use — not
 *     the separate "warm editorial" tokens (`tmt-amber`, `tmt-navy-warm`,
 *     `tmt-cream-warm`) this page used before, which were close but not the
 *     same hex values as the rest of the site.
 *   - Card/input/button conventions: the same `rounded-lg`, `border-2
 *     border-gray-200 focus:border-tmt-orange`, `bg-tmt-orange
 *     hover:bg-tmt-orange-light` classes FeedbackWidget.tsx (the site's only
 *     other public-facing form) already uses.
 *   - DecorativeGear: the same rotating-gear motif the homepage uses, in
 *     place of the previous bespoke orb/particle/watermark animation system.
 *
 * FUNCTIONALITY IS UNCHANGED — this is the same `handleSubmit`, the same
 * `signIn("credentials", ...)` call, the same state variables that matter
 * (email, password, role, rememberMe, showPassword, submitting, error), the
 * same redirect logic, the same Administrator/Editor UI-only selector. Only
 * presentation-only state was removed: input-focus-glow tracking, the
 * mount-fade timer, and the sliding-pill measurement refs — none of that
 * touched authentication.
 *
 * `handleSubmit` calls Auth.js's `signIn("credentials", ...)` directly with
 * `redirect: false`, so a failed login renders inline instead of bouncing to
 * Auth.js's own error page.
 */
export function LoginForm() {
  const [role, setRole] = useState<"administrator" | "editor">("administrator");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Please enter your email and password.");
      return;
    }

    setSubmitting(true);
    try {
      // `redirect: false` keeps the user on this page so a failure can be
      // rendered inline instead of bouncing to Auth.js's own error page.
      const result = await signIn("credentials", {
        email: email.trim(),
        password,
        redirect: false,
      });

      if (!result || result.error) {
        // Deliberately vague: never reveal whether the address exists.
        setError("Incorrect email or password.");
        setSubmitting(false);
        return;
      }

      // NOTE: the Administrator/Editor toggle is a UI affordance, not an
      // access decision. Whichever pill is selected, the real role comes from
      // the database and both roles land on the same dashboard — where the
      // sidebar and every API route gate on the true role. Trusting the
      // client's choice here would be a privilege-escalation hole.
      const destination = searchParams.get("from") ?? "/dashboard";

      // refresh() re-runs the server layouts so the new session is picked up
      // before the dashboard renders.
      router.replace(destination);
      router.refresh();
    } catch {
      setError("Unable to sign in right now. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row overflow-x-hidden bg-tmt-cream font-sans">
      {/* ══════════════════ HERO PANEL — same banner treatment as Header.tsx ══════════════════ */}
      <div className="relative lg:w-[55%] w-full flex flex-col overflow-hidden bg-gradient-to-br from-tmt-cream via-tmt-orange to-tmt-navy">
        {/* Same contrast overlay Header.tsx uses over its gradient. */}
        <div className="absolute inset-0 bg-white/30" />

        {/* Homepage's own decorative motif, not a bespoke one — hidden on
            mobile like the homepage already hides these on small screens. */}
        <DecorativeGear
          className="absolute top-8 right-8 text-tmt-navy animate-spin-slow hidden sm:block"
          size={90}
        />
        <DecorativeGear
          className="absolute bottom-10 left-8 text-white animate-spin-reverse hidden lg:block"
          size={70}
        />

        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 py-10 sm:py-14 lg:py-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-white/50 border border-tmt-navy/10 text-tmt-navy text-[11px] sm:text-xs font-semibold uppercase tracking-[0.14em] mb-6">
            Official Publication &middot; MSU&ndash;COE
          </span>

          <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 relative mb-5 drop-shadow-lg">
            <Image
              src="/images/logo.png"
              alt="The Matrix Today"
              fill
              priority
              sizes="(min-width: 1024px) 112px, 96px"
              className="object-contain"
            />
          </div>

          {/* Same gradient-text technique Header.tsx uses for its headline. */}
          <h1
            className="text-3xl sm:text-4xl lg:text-5xl font-extrabold mb-3 leading-tight"
            style={{
              background: "linear-gradient(135deg, #FF7D00 0%, #FA9721 50%, #062F3D 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              filter: "drop-shadow(0 0 20px rgba(255,255,255,0.5))",
            }}
          >
            The Matrix Today
          </h1>

          <p className="text-tmt-navy font-medium text-base sm:text-lg mb-1">
            Editorial Portal
          </p>
          <p className="text-tmt-navy/80 text-sm max-w-sm">
            The eyes, ears, and voice of the College of Engineering.
          </p>
        </div>
      </div>

      {/* ══════════════════ FORM PANEL ══════════════════ */}
      <div className="relative lg:w-[45%] w-full flex items-center justify-center px-4 sm:px-6 py-10 lg:py-12">
        <div className="w-full max-w-md">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-tmt-orange transition-colors mb-6 group"
          >
            <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
            Back to Website
          </Link>

          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 sm:p-8">
            <div className="mb-6">
              <h2 className="text-2xl sm:text-3xl font-bold text-tmt-navy mb-1.5">
                Welcome Back
              </h2>
              <p className="text-sm text-gray-500">
                Sign in to access The Matrix Today Editorial Portal.
              </p>
            </div>

            {/* Administrator / Editor selector — UI affordance only, see
                handleSubmit's note above. Plain two-button toggle, matching
                the active/inactive convention Navigation.tsx already uses
                for its nav links (solid tmt-orange fill when active). */}
            <div className="flex p-1 mb-4 rounded-lg bg-gray-100 border border-gray-200">
              <button
                type="button"
                onClick={() => setRole("administrator")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                  role === "administrator"
                    ? "bg-tmt-orange text-white shadow-sm"
                    : "text-gray-500 hover:text-tmt-navy"
                }`}
              >
                <Shield size={14} />
                Administrator
              </button>
              <button
                type="button"
                onClick={() => setRole("editor")}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 text-xs sm:text-sm font-semibold rounded-md transition-colors ${
                  role === "editor"
                    ? "bg-tmt-orange text-white shadow-sm"
                    : "text-gray-500 hover:text-tmt-navy"
                }`}
              >
                <PenLine size={14} />
                Editor
              </button>
            </div>

            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-tmt-orange/10 text-tmt-orange text-xs font-semibold mb-5">
              {role === "administrator" ? <Shield size={12} /> : <PenLine size={12} />}
              {role === "administrator" ? "Administrator Portal" : "Editor Portal"}
            </div>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700 mb-4"
              >
                <AlertCircle size={16} className="shrink-0 mt-0.5" />
                <span className="break-words">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-semibold text-tmt-navy mb-1.5"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={submitting}
                  placeholder="you@msu.edu.ph"
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors text-sm"
                  autoComplete="email"
                />
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-tmt-navy mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={submitting}
                    placeholder="••••••••••••"
                    className="w-full px-4 py-3 pr-11 border-2 border-gray-200 rounded-lg focus:border-tmt-orange focus:outline-none transition-colors text-sm"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    disabled={submitting}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-tmt-navy transition-colors disabled:cursor-not-allowed"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                  </button>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    className="rounded border-gray-300 text-tmt-orange focus:ring-tmt-orange"
                  />
                  <span className="text-sm text-gray-600 select-none">Remember me</span>
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm font-medium text-tmt-orange hover:text-tmt-orange-light transition-colors"
                >
                  Forgot password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 rounded-lg bg-tmt-orange hover:bg-tmt-orange-light disabled:opacity-60 text-white font-semibold transition-colors mt-1"
              >
                {submitting ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    Signing in…
                  </>
                ) : (
                  <>
                    Sign In
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            <p className="text-center text-xs text-gray-500 mt-6 leading-relaxed">
              Authorized personnel only. Readers and visitors do not require an account.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

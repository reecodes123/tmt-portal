"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, CheckCircle2, KeyRound, Loader2 } from "lucide-react";
import { requestPasswordReset } from "@/lib/api-client";

/**
 * Password-reset request form.
 *
 * Visually a smaller sibling of LoginForm — same cream/navy/orange card
 * language and input styling, so this doesn't feel like a different app —
 * but without LoginForm's full animated two-panel hero, which would be a lot
 * of duplicated decoration for a page most people see once and leave.
 *
 * Deliberately mobile-first single column: this is exactly the kind of form
 * someone fills out on a phone after getting locked out, not at a desk.
 *
 * Always shows the same generic confirmation regardless of whether the
 * email had an account — see forgot-password/route.ts for why; the UI must
 * not undermine that by, say, showing a different error for "not found".
 */
export function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSubmitted(true);
    } catch {
      // Rate-limit or network failure — the route itself never returns a
      // distinguishing error for "email not found", so anything caught here
      // is a genuine transport problem, safe to say plainly.
      setError("Something went wrong. Please try again in a moment.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center px-5 py-12 font-sans overflow-x-hidden"
      style={{ background: "#F5EFE0" }}
    >
      <div className="relative w-full max-w-[420px]">
        <div
          className="absolute -inset-[1px] rounded-[33px] pointer-events-none"
          style={{
            background:
              "linear-gradient(90deg, rgba(217,138,26,0.30), rgba(12,52,68,0.10), rgba(217,138,26,0.30))",
          }}
        />
        <div
          className="rounded-[32px] overflow-hidden relative"
          style={{
            background: "rgba(255,255,255,0.92)",
            border: "1px solid rgba(12,52,68,0.10)",
            boxShadow:
              "0 24px 60px rgba(12,52,68,0.18), 0 8px 20px rgba(12,52,68,0.08)",
          }}
        >
          <div className="px-6 pt-7 pb-8 sm:px-8 sm:pt-8 sm:pb-9">
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-sm mb-7 group"
              style={{ color: "rgba(12,52,68,0.55)" }}
            >
              <ArrowLeft size={14} className="transition-transform duration-200 group-hover:-translate-x-1" />
              <span className="group-hover:opacity-75 transition-opacity">Back to Sign In</span>
            </Link>

            {submitted ? (
              <div>
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                  style={{ background: "rgba(34,197,94,0.12)" }}
                >
                  <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
                </div>
                <h2
                  className="mb-2 leading-tight"
                  style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 700, color: "#0C3444" }}
                >
                  Check Your Email
                </h2>
                <p className="text-sm leading-relaxed mb-1" style={{ color: "rgba(12,52,68,0.65)" }}>
                  If an account exists for <span className="font-semibold">{email.trim()}</span>,
                  we&apos;ve sent a link to reset your password. It expires in 30 minutes.
                </p>
                <p className="text-sm leading-relaxed" style={{ color: "rgba(12,52,68,0.50)" }}>
                  Didn&apos;t get it? Check your spam folder, or{" "}
                  <button
                    type="button"
                    onClick={() => setSubmitted(false)}
                    className="underline font-medium"
                    style={{ color: "#B67210" }}
                  >
                    try again
                  </button>
                  .
                </p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
                    style={{ background: "rgba(217,138,26,0.12)" }}
                  >
                    <KeyRound size={22} style={{ color: "#B67210" }} />
                  </div>
                  <h2
                    className="mb-1.5 leading-tight"
                    style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 700, color: "#0C3444" }}
                  >
                    Forgot Password?
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(12,52,68,0.60)" }}>
                    Enter the email on your Editorial Portal account and we&apos;ll send you a
                    link to reset your password.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 rounded-2xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700"
                  >
                    {error}
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <div className="flex flex-col gap-1.5">
                    <label
                      htmlFor="email"
                      className="text-[10px] font-medium uppercase tracking-[0.14em]"
                      style={{ color: "rgba(12,52,68,0.60)" }}
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
                      autoComplete="email"
                      autoFocus
                      className="w-full text-sm outline-none transition-all duration-300"
                      style={{
                        height: 56,
                        padding: "0 1rem",
                        borderRadius: 18,
                        background: "rgba(255,255,255,0.75)",
                        border: "1.5px solid rgba(12,52,68,0.10)",
                        color: "#0C3444",
                      }}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed"
                    style={{
                      height: 56,
                      borderRadius: 18,
                      fontSize: "0.96rem",
                      background: "linear-gradient(135deg, #E8A03D 0%, #D98A1A 50%, #B67210 100%)",
                      boxShadow: "0 4px 16px rgba(217,138,26,0.32)",
                    }}
                  >
                    {submitting ? (
                      <>
                        <Loader2 size={17} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        Send Reset Link
                        <ArrowRight size={17} />
                      </>
                    )}
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  Loader2,
  ShieldAlert,
} from "lucide-react";
import { resetPassword } from "@/lib/api-client";

interface Props {
  /** From the ?token= query param — null when the link was opened without one. */
  token: string | null;
}

/**
 * Set-new-password form, landed on from the emailed reset link.
 *
 * Same visual family as ForgotPasswordForm/LoginForm. A missing/blank token
 * (someone bookmarked the page, or stripped the query string) is handled as
 * its own state rather than letting the form submit and fail — cheaper to
 * catch here than to make the user type a password just to be told the link
 * was bad.
 */
export function ResetPasswordForm({ token }: Props) {
  const router = useRouter();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [succeeded, setSucceeded] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (newPassword !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setSubmitting(true);
    try {
      await resetPassword(token as string, newPassword);
      setSucceeded(true);
      setTimeout(() => router.push("/login"), 2500);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Could not reset your password."
      );
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

            {!token ? (
              <InvalidLinkState />
            ) : succeeded ? (
              <SuccessState />
            ) : (
              <>
                <div className="mb-6">
                  <h2
                    className="mb-1.5 leading-tight"
                    style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 700, color: "#0C3444" }}
                  >
                    Set a New Password
                  </h2>
                  <p className="text-sm leading-relaxed" style={{ color: "rgba(12,52,68,0.60)" }}>
                    Choose a new password for your Editorial Portal account. At least 10
                    characters, with a mix of upper/lowercase letters and a number.
                  </p>
                </div>

                {error && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-2.5 rounded-2xl bg-red-50 border border-red-100 p-3.5 text-sm text-red-700"
                  >
                    <ShieldAlert size={17} className="shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-4">
                  <PasswordField
                    id="newPassword"
                    label="New Password"
                    value={newPassword}
                    onChange={setNewPassword}
                    show={showPassword}
                    onToggleShow={() => setShowPassword((v) => !v)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />
                  <PasswordField
                    id="confirmPassword"
                    label="Confirm New Password"
                    value={confirmPassword}
                    onChange={setConfirmPassword}
                    show={showPassword}
                    onToggleShow={() => setShowPassword((v) => !v)}
                    disabled={submitting}
                    autoComplete="new-password"
                  />

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full flex items-center justify-center gap-2 font-semibold text-white transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed mt-1"
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
                        Resetting…
                      </>
                    ) : (
                      <>
                        Reset Password
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

function PasswordField({
  id,
  label,
  value,
  onChange,
  show,
  onToggleShow,
  disabled,
  autoComplete,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  show: boolean;
  onToggleShow: () => void;
  disabled: boolean;
  autoComplete: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label
        htmlFor={id}
        className="text-[10px] font-medium uppercase tracking-[0.14em]"
        style={{ color: "rgba(12,52,68,0.60)" }}
      >
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder="••••••••••••"
          autoComplete={autoComplete}
          className="w-full text-sm outline-none transition-all duration-300"
          style={{
            height: 56,
            padding: "0 3rem 0 1rem",
            borderRadius: 18,
            background: "rgba(255,255,255,0.75)",
            border: "1.5px solid rgba(12,52,68,0.10)",
            color: "#0C3444",
          }}
        />
        <button
          type="button"
          onClick={onToggleShow}
          disabled={disabled}
          className="absolute right-4 top-1/2 -translate-y-1/2 hover:opacity-80"
          style={{ color: "rgba(12,52,68,0.50)" }}
          aria-label={show ? "Hide password" : "Show password"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
    </div>
  );
}

function SuccessState() {
  return (
    <div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(34,197,94,0.12)" }}
      >
        <CheckCircle2 size={24} style={{ color: "#16a34a" }} />
      </div>
      <h2 className="mb-2 leading-tight" style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 700, color: "#0C3444" }}>
        Password Reset
      </h2>
      <p className="text-sm leading-relaxed" style={{ color: "rgba(12,52,68,0.65)" }}>
        Your password has been changed. Taking you to Sign In…
      </p>
    </div>
  );
}

function InvalidLinkState() {
  return (
    <div>
      <div
        className="w-12 h-12 rounded-full flex items-center justify-center mb-4"
        style={{ background: "rgba(239,68,68,0.10)" }}
      >
        <ShieldAlert size={22} style={{ color: "#dc2626" }} />
      </div>
      <h2 className="mb-2 leading-tight" style={{ fontSize: "clamp(1.5rem, 6vw, 1.85rem)", fontWeight: 700, color: "#0C3444" }}>
        Invalid Link
      </h2>
      <p className="text-sm leading-relaxed mb-5" style={{ color: "rgba(12,52,68,0.60)" }}>
        This password reset link is missing its token. Request a new one from the
        forgot password page.
      </p>
      <Link
        href="/forgot-password"
        className="inline-flex items-center gap-2 text-sm font-semibold"
        style={{ color: "#B67210" }}
      >
        Request a new link
        <ArrowRight size={15} />
      </Link>
    </div>
  );
}

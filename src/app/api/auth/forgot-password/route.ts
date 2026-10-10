import type { NextRequest } from "next/server";
import { forgotPasswordSchema } from "@/lib/validation";
import { createPasswordResetToken } from "@/server/repositories/passwordReset";
import { sendPasswordResetEmail } from "@/server/email";
import { checkRateLimit } from "@/server/rateLimit";
import { handle, parseJson, RateLimitError } from "../../_helpers";

/** Same generic message regardless of whether the email has an account. */
const GENERIC_RESPONSE = {
  message:
    "If an account exists for that email, a password reset link has been sent.",
};

export async function POST(request: NextRequest) {
  return handle(async () => {
    // 5 requests / 15 min per IP — public, unauthenticated, and each success
    // triggers a real SMTP send, so this is a meaningfully more sensitive
    // bucket than the anonymous like/bookmark endpoints (30/min).
    if (!checkRateLimit(request, "forgot-password", 5, 15 * 60 * 1000)) {
      throw new RateLimitError();
    }

    const { email } = await parseJson(request, forgotPasswordSchema);
    const result = await createPasswordResetToken(email);

    // Deliberately don't branch the HTTP response on `result` — returning a
    // different message for "no such account" would let this endpoint be
    // used to enumerate valid staff emails. Only the side effect (sending
    // mail) differs; the response never does.
    if (result) {
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
      const resetUrl = `${baseUrl}/reset-password?token=${result.token}`;
      try {
        await sendPasswordResetEmail(email.trim().toLowerCase(), result.displayName, resetUrl);
      } catch (err) {
        // Log server-side for the admin to notice a misconfigured SMTP
        // setup, but still return the generic success response — a public,
        // unauthenticated endpoint shouldn't reveal infrastructure state
        // either way.
        // eslint-disable-next-line no-console
        console.error("[forgot-password] failed to send reset email", err);
      }
    }

    return GENERIC_RESPONSE;
  });
}

/**
 * Outbound transactional email — Gmail SMTP via nodemailer. SERVER ONLY.
 *
 * Currently used for one thing: password-reset links. Kept as a single small
 * module (one transport, one branded template, one send function) rather
 * than a generic mailer abstraction — there's exactly one email this app
 * sends today, and building a multi-provider abstraction for that would be
 * exactly the kind of premature complexity this codebase avoids elsewhere.
 *
 * SETUP (you must do this — nothing here can send real mail without it):
 *   1. The Gmail account needs 2-Step Verification turned on.
 *   2. Generate an App Password: Google Account → Security → 2-Step
 *      Verification → App passwords. Create one for "Mail" — Google gives
 *      you a 16-character password. That is NOT your normal Gmail password
 *      and is the only thing this app should ever be given.
 *   3. Add to `.env` (never commit this file — it's already gitignored):
 *        GMAIL_USER="youraddress@gmail.com"
 *        GMAIL_APP_PASSWORD="the 16-character app password, spaces removed"
 *   4. Restart the dev server (env vars are only read at process start).
 *
 * Without both variables set, `sendPasswordResetEmail` throws instead of
 * silently pretending to succeed — see the route that calls it for how that
 * failure is handled without leaking anything to the client.
 */

import nodemailer from "nodemailer";

let cachedTransporter: ReturnType<typeof nodemailer.createTransport> | null = null;

function getTransporter() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Email is not configured: set GMAIL_USER and GMAIL_APP_PASSWORD in .env (see src/server/email.ts for setup steps)."
    );
  }

  // Built once per server process, not per send — the same pattern as
  // server/db.ts's single shared Prisma client.
  cachedTransporter ??= nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass },
  });

  return cachedTransporter;
}

const BRAND = {
  navy: "#0C3444",
  orange: "#D98A1A",
  cream: "#F5EFE0",
};

/**
 * Inline-styled on purpose — most email clients (Gmail included) strip
 * `<style>` blocks and external stylesheets, so anything that must render
 * consistently has to be inline. Table-based layout would be the more
 * bulletproof-for-Outlook approach; skipped here since this app's two real
 * recipients (eic@/editor@marsu.edu.ph) both read mail in Gmail, and a
 * single-column div layout renders fine there and on mobile Gmail apps.
 */
function resetEmailHtml(displayName: string, resetUrl: string): string {
  return `<!doctype html>
<html>
  <body style="margin:0;padding:0;background:${BRAND.cream};font-family:Arial,Helvetica,sans-serif;">
    <div style="max-width:480px;margin:0 auto;padding:32px 20px;">
      <div style="background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid rgba(12,52,68,0.10);">
        <div style="background:${BRAND.navy};padding:24px 28px;">
          <p style="margin:0;color:#ffffff;font-size:18px;font-weight:700;">The Matrix Today</p>
          <p style="margin:4px 0 0;color:rgba(255,255,255,0.65);font-size:12px;letter-spacing:0.06em;text-transform:uppercase;">Editorial Portal</p>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 16px;color:${BRAND.navy};font-size:16px;">Hi ${escapeHtml(displayName)},</p>
          <p style="margin:0 0 24px;color:rgba(12,52,68,0.75);font-size:14px;line-height:1.6;">
            We received a request to reset the password on your Editorial Portal account.
            If this was you, tap the button below to choose a new password. This link
            expires in 30 minutes and can only be used once.
          </p>
          <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
            <tr>
              <td align="center">
                <a href="${resetUrl}"
                  style="display:inline-block;background:${BRAND.orange};color:#ffffff;text-decoration:none;
                         font-weight:700;font-size:14px;padding:14px 28px;border-radius:12px;">
                  Reset Password
                </a>
              </td>
            </tr>
          </table>
          <p style="margin:24px 0 0;color:rgba(12,52,68,0.55);font-size:12px;line-height:1.6;word-break:break-all;">
            Or paste this link into your browser:<br />
            <a href="${resetUrl}" style="color:${BRAND.orange};">${resetUrl}</a>
          </p>
          <p style="margin:24px 0 0;color:rgba(12,52,68,0.45);font-size:12px;line-height:1.6;">
            If you didn't request this, you can safely ignore this email — your password
            will not be changed.
          </p>
        </div>
      </div>
      <p style="text-align:center;color:rgba(12,52,68,0.40);font-size:11px;margin:20px 0 0;">
        The Matrix Today · College of Engineering · Marinduque State University
      </p>
    </div>
  </body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export async function sendPasswordResetEmail(
  to: string,
  displayName: string,
  resetUrl: string
): Promise<void> {
  const transporter = getTransporter();
  await transporter.sendMail({
    from: `"The Matrix Today" <${process.env.GMAIL_USER}>`,
    to,
    subject: "Reset your Editorial Portal password",
    html: resetEmailHtml(displayName, resetUrl),
  });
}

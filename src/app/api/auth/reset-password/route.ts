import type { NextRequest } from "next/server";
import { resetPasswordSchema } from "@/lib/validation";
import { resetPasswordWithToken } from "@/server/repositories/passwordReset";
import { checkRateLimit } from "@/server/rateLimit";
import { ConflictError, handle, parseJson, RateLimitError } from "../../_helpers";

export async function POST(request: NextRequest) {
  return handle(async () => {
    // Guards brute-forcing the token itself, not enumeration — the token is
    // a 32-byte random value, so this is a speed bump, not the real defense
    // (that's the token's entropy).
    if (!checkRateLimit(request, "reset-password", 10, 15 * 60 * 1000)) {
      throw new RateLimitError();
    }

    const { token, newPassword } = await parseJson(request, resetPasswordSchema);
    const succeeded = await resetPasswordWithToken(token, newPassword);

    if (!succeeded) {
      // Unlike forgot-password, this CAN be specific: the token itself is
      // already a secret only the recipient has, so confirming it's
      // invalid/expired doesn't enumerate anything.
      throw new ConflictError(
        "This reset link is invalid or has expired. Request a new one."
      );
    }

    return { message: "Your password has been reset. You can now sign in." };
  });
}

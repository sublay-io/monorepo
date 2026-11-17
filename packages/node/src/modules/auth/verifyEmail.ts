import { SublayHttpClient } from "../../core/client";

export interface VerifyEmailProps {
  /** The link token or the emailed 6-digit code. */
  token: string;
  /**
   * The `verificationId` returned with a code (by sign-up, or by a sign-in
   * refused with `auth/email-not-verified`). Required to confirm such a code.
   */
  verificationId?: string;
}

export async function verifyEmail(
  client: SublayHttpClient,
  data: VerifyEmailProps
): Promise<void> {
  await client.projectInstance.post("/auth/verify-email", data);
}

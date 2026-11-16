import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import type { EmailVerificationOptions } from "../../interfaces/EmailVerification";

export interface SignInProps {
  email: string;
  password: string;
  /**
   * How the confirmation email is sent when sign-in is refused because the
   * account's email isn't confirmed (`403 auth/email-not-verified`, whose body
   * carries `verificationId` in code mode). Ignored when the project doesn't
   * require email verification before sign-in.
   */
  emailVerification?: EmailVerificationOptions;
}

export interface SignInResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

export async function signIn(
  client: SublayHttpClient,
  data: SignInProps
): Promise<SignInResponse> {
  const response = await client.projectInstance.post<SignInResponse>(
    "/auth/sign-in",
    data
  );
  return response.data;
}

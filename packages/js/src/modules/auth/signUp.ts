import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import type {
  EmailVerificationOptions,
  EmailVerificationRequiredResponse,
} from "../../interfaces/EmailVerification";

export interface SignUpProps {
  email: string;
  password: string;
  name?: string;
  username?: string;
  avatar?: string;
  bio?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  /** ISO 8601 datetime string. */
  birthdate?: string;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  /**
   * How the confirmation email is sent when the project requires email
   * verification before sign-in. Ignored when the setting is off.
   */
  emailVerification?: EmailVerificationOptions;
}

export interface SignUpResponse {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
}

/**
 * Creates an account. When the project requires email verification before
 * sign-in, the server answers `202` with `{ emailVerificationRequired: true }`
 * instead of a session: no tokens are stored, and the user signs in after
 * confirming their email.
 */
export async function signUp(
  client: SublayHttpClient,
  data: SignUpProps
): Promise<SignUpResponse | EmailVerificationRequiredResponse> {
  const response = await client.projectInstance.post<
    SignUpResponse | EmailVerificationRequiredResponse
  >("/auth/sign-up", data);
  const body = response.data;
  // Tokens only come back when the project lets users in at sign-up.
  if (body && "accessToken" in body && body.accessToken) {
    client.setTokens({
      accessToken: body.accessToken,
      refreshToken: body.refreshToken,
    });
  }
  return body;
}

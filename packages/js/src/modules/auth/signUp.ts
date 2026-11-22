import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import {
  appendField,
  appendFields,
  appendFile,
  withoutNulls,
} from "../../core/multipart";
import type { UserImageUpload } from "../users/updateUser";
import type {
  EmailVerificationOptions,
  EmailVerificationRequiredResponse,
} from "../../interfaces/EmailVerification";

export interface SignUpProps {
  email: string;
  password: string;
  /** `null` (or an empty string) for none. */
  name?: string | null;
  username?: string;
  /** An image URL, or `null` for none. */
  avatar?: string | null;
  /** `null` (or an empty string) for none. */
  bio?: string | null;
  location?: {
    latitude: number;
    longitude: number;
  };
  /**
   * A `Date`, or a full UTC timestamp string such as
   * `"1990-05-17T00:00:00.000Z"` (a date alone, like `"1990-05-17"`, is refused).
   */
  birthdate?: string | Date;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  /**
   * How the confirmation email is sent when the project requires email
   * verification before sign-in. Ignored when the setting is off.
   */
  emailVerification?: EmailVerificationOptions;
  /**
   * Avatar image. When present the request is sent as `multipart/form-data`
   * and the server processes the image per `options`.
   */
  avatarFile?: UserImageUpload;
  /** Banner image; same contract as {@link SignUpProps.avatarFile}. */
  bannerFile?: UserImageUpload;
}

export interface SignUpResponse {
  success: true;
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
  const { avatarFile, bannerFile, ...fields } = data;
  let payload: FormData | typeof fields = fields;
  if (avatarFile || bannerFile) {
    const formData = new FormData();
    if (avatarFile) {
      appendFile(formData, "avatarFile", avatarFile.file, { fallback: "avatar" });
      appendField(formData, "avatarFile.options", avatarFile.options);
    }
    if (bannerFile) {
      appendFile(formData, "bannerFile", bannerFile.file, { fallback: "banner" });
      appendField(formData, "bannerFile.options", bannerFile.options);
    }
    // Object fields (location, metadata, emailVerification...) as JSON strings.
    appendFields(formData, withoutNulls(fields));
    payload = formData;
  }
  const response = await client.projectInstance.post<
    SignUpResponse | EmailVerificationRequiredResponse
  >("/auth/sign-up", payload);
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

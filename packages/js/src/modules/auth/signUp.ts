import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import { appendField, appendFields, appendFile } from "../../core/multipart";
import type { UserImageUpload } from "../users/updateUser";
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
  /**
   * Avatar image. When present the request is sent as `multipart/form-data`
   * and the server processes the image per `options`.
   */
  avatarFile?: UserImageUpload;
  /** Banner image; same contract as {@link SignUpProps.avatarFile}. */
  bannerFile?: UserImageUpload;
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
    appendFields(formData, fields);
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

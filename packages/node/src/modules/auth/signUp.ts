import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import {
  appendFields,
  appendImageSlot,
  withoutNulls,
  type ImageSlotFile,
} from "../../core/formData";
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
   * The user's avatar image. When present (or `bannerFile` is), the request is
   * sent as `multipart/form-data` and the server processes the image per
   * `options`.
   */
  avatarFile?: ImageSlotFile;
  /** The user's banner image; same contract as {@link SignUpProps.avatarFile}. */
  bannerFile?: ImageSlotFile;
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
 * instead of a session.
 */
export async function signUp(
  client: SublayHttpClient,
  data: SignUpProps
): Promise<SignUpResponse | EmailVerificationRequiredResponse> {
  const { avatarFile, bannerFile, ...body } = data;
  let payload: FormData | typeof body = body;
  if (avatarFile || bannerFile) {
    const formData = new FormData();
    appendFields(formData, withoutNulls(body));
    if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile, "banner");
    payload = formData;
  }
  const response = await client.projectInstance.post<
    SignUpResponse | EmailVerificationRequiredResponse
  >("/auth/sign-up", payload);
  return response.data;
}

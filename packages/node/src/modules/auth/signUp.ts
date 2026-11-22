import { SublayHttpClient } from "../../core/client";
import { AuthUser } from "../../interfaces/User";
import {
  appendFields,
  appendImageSlot,
  refuseNullWithFile,
  type ImageSlotFile,
} from "../../core/formData";
import type {
  EmailVerificationOptions,
  EmailVerificationRequiredResponse,
} from "../../interfaces/EmailVerification";

export interface SignUpProps {
  email: string;
  password: string;
  /** `null` (or an empty string) for none; not with a file attached. */
  name?: string | null;
  username?: string;
  /** An image URL, or `null` for none; not with a file attached. */
  avatar?: string | null;
  /** `null` (or an empty string) for none; not with a file attached. */
  bio?: string | null;
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
    refuseNullWithFile("signUp", body);
    const formData = new FormData();
    appendFields(formData, body);
    if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile, "banner");
    payload = formData;
  }
  const response = await client.projectInstance.post<
    SignUpResponse | EmailVerificationRequiredResponse
  >("/auth/sign-up", payload);
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { User, UserIncludeParam } from "../../interfaces/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchOrCreateUserByForeignIdProps
  extends SpaceReputationUserParams {
  /** Your own id for the user, used exactly as sent. A blank or whitespace-only one is a 400. */
  foreignId: string;
  /** Used only when the user is created. */
  name?: string;
  /**
   * Used only when the user is created. Must be unique in the project, 3 to 30
   * characters after trimming, and only letters, numbers, `_` and `-` (as on
   * sign-up and updateUser); otherwise a 400.
   */
  username?: string;
  /** Used only when the user is created. A URL, or `null` for none. */
  avatar?: string | null;
  /** Used only when the user is created. */
  bio?: string;
  /** Used only when the user is created. A JSON object, up to 1 MB. */
  metadata?: Record<string, any>;
  /**
   * Used only when the user is created. A JSON object, up to 1 MB. Never
   * returned by the API.
   */
  secureMetadata?: Record<string, any>;
  include?: UserIncludeParam;
  /**
   * The user the response is read as (block hide), as on
   * `fetchUserByForeignId`. It never changes who creates: a user created by
   * this call is always created by the app.
   */
  actingUserId?: string;
}

export interface FetchOrCreateUserByForeignIdResult {
  user: User;
  /** `true` when this call created the user (HTTP 201), `false` when it existed (200). */
  created: boolean;
}

/**
 * POST /users/by-foreign-id — return the user with this foreign id, or create
 * them with the given profile when there is none. An existing user comes back
 * unchanged (the profile fields never update it). Everything travels in the
 * body, so the profile never appears in a URL.
 *
 * Resolves to `{ user, created }`: `created` is true when the server answered
 * 201. A username another user already holds is a 409 (`DUPLICATE_USER_FIELD`).
 */
export async function fetchOrCreateUserByForeignId(
  client: SublayHttpClient,
  data: FetchOrCreateUserByForeignIdProps
): Promise<FetchOrCreateUserByForeignIdResult> {
  const {
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...body
  } = data;

  const response = await client.projectInstance.post<User>(
    "/users/by-foreign-id",
    {
      // `include` goes as given: a JSON body carries a string or an array.
      ...body,
      ...buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    }
  );

  // 201 is a user this call created; 200 is an existing one (also the loser
  // of a concurrent create).
  return { user: response.data, created: response.status === 201 };
}

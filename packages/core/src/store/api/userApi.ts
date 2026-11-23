import { baseApi } from './baseApi';
import type { AuthUser } from '../../interfaces/models/User';
import {
  appendImageSlot,
  refuseNullWithFile,
  type ImageSlotUpload,
} from '../../utils/uploads';

// Types for user API
export interface UpdateUserParams {
  /** `null` (or an empty string) clears it, on an update without files. */
  name?: string | null;
  username?: string;
  /**
   * The avatar as an image URL. To upload an image, use `avatarFile`. `null`
   * clears it, on an update without files.
   */
  avatar?: string | null;
  /** `null` (or an empty string) clears it, on an update without files. */
  bio?: string | null;
  /**
   * A `Date`, or a full UTC timestamp string such as
   * `"1990-05-17T00:00:00.000Z"` (a date alone, like `"1990-05-17"`, is refused).
   */
  birthdate?: string | Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  /** A new avatar image, replacing the current one. */
  avatarFile?: ImageSlotUpload;
  /** A new banner image, replacing the current one. */
  bannerFile?: ImageSlotUpload;
  /**
   * Files to remove: the user's `avatarFileId` and/or `bannerFileId`.
   * Removing one clears that image.
   */
  removeFileIds?: string[];
}

export interface UpdateUserRequest {
  projectId: string;
  userId: string;
  update: UpdateUserParams;
}

/** Whether the update carries a file, so it has to go as multipart form data. */
export function userUpdateHasFiles(update: UpdateUserParams): boolean {
  return !!(update.avatarFile || update.bannerFile);
}

/**
 * The multipart body of a user update that carries files. Every non-file
 * field goes as a string (objects and arrays as JSON). A multipart field can't
 * carry `null`, so a field set to `null` throws before anything is sent.
 *
 * Multipart requests go through `axiosPrivate` (see `useUserActions`), not the
 * RTK Query endpoint below: RTK's base query sets `Content-Type:
 * application/json` on every request, which a FormData body can't travel
 * under.
 */
export function buildUserUpdateFormData(update: UpdateUserParams): FormData {
  const { avatarFile, bannerFile, ...fields } = update;
  refuseNullWithFile("updateUser", fields);

  const formData = new FormData();

  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined || value === null) continue;
    if (value instanceof Date) {
      formData.append(key, value.toISOString());
    } else if (typeof value === "object") {
      formData.append(key, JSON.stringify(value));
    } else {
      formData.append(key, String(value));
    }
  }
  if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile);
  if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile);

  return formData;
}

// Inject user-specific endpoints into the base API
export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Update current user, JSON only. An update with files goes as multipart
    // through `axiosPrivate` instead (`useUserActions`), since RTK's base
    // query forces a JSON content type.
    updateUser: builder.mutation<AuthUser, UpdateUserRequest>({
      query: ({ projectId, userId, update }) => ({
        url: `/${projectId}/users/${userId}`,
        method: 'PATCH',
        body: update,
      }),
      // No complex optimistic updates needed - let useUserActions handle state updates
      invalidatesTags: () => [
        { type: 'User' as const, id: 'CURRENT' },
      ],
    }),

    // Removed other-user queries - these should use the existing legacy hooks:
    // - useFetchUser
    // - useFetchUserByForeignId
    // - useFetchUserFollowersCount
    // - useFetchUserFollowingCount
    // - useCheckUsernameAvailability
    // - useFetchUserSuggestions
  }),
});

// Export generated hooks (current user management only)
export const {
  useUpdateUserMutation,
} = userApi;
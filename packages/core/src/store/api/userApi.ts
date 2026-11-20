import { baseApi } from './baseApi';
import type { AuthUser } from '../../interfaces/models/User';
import { appendImageSlot, type ImageSlotUpload } from '../../utils/uploads';

// Types for user API
export interface UpdateUserParams {
  name?: string | null;
  username?: string | null;
  /**
   * The avatar as an image URL. To upload an image, use `avatarFile`. `null`
   * clears it, on an update without files only.
   */
  avatar?: string | null;
  bio?: string;
  birthdate?: Date | null;
  location?: {
    latitude: number;
    longitude: number;
  } | null;
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
 * field goes as a string (objects and arrays as JSON).
 *
 * Multipart requests go through `axiosPrivate` (see `useUserActions`), not the
 * RTK Query endpoint below: RTK's base query sets `Content-Type:
 * application/json` on every request, which a FormData body can't travel
 * under.
 */
export function buildUserUpdateFormData(update: UpdateUserParams): FormData {
  const formData = new FormData();

  if (update.name !== undefined) {
    formData.append("name", update.name === null ? "" : update.name);
  }
  if (update.username !== undefined) {
    formData.append("username", update.username === null ? "" : update.username);
  }
  if (update.bio !== undefined) {
    formData.append("bio", update.bio);
  }
  if (update.birthdate !== undefined) {
    formData.append("birthdate", update.birthdate ? update.birthdate.toISOString() : "");
  }
  if (typeof update.avatar === "string") {
    formData.append("avatar", update.avatar);
  }
  if (update.location !== undefined) {
    formData.append("location", update.location === null ? "null" : JSON.stringify(update.location));
  }
  if (update.metadata !== undefined) {
    formData.append("metadata", JSON.stringify(update.metadata));
  }
  if (update.secureMetadata !== undefined) {
    formData.append("secureMetadata", JSON.stringify(update.secureMetadata));
  }
  if (update.removeFileIds !== undefined) {
    formData.append("removeFileIds", JSON.stringify(update.removeFileIds));
  }
  if (update.avatarFile) appendImageSlot(formData, "avatarFile", update.avatarFile);
  if (update.bannerFile) appendImageSlot(formData, "bannerFile", update.bannerFile);

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
import { SublayHttpClient } from "../../core/client";
import { UserFull } from "../../interfaces/User";
import { appendFields, appendImageSlot, type ImageSlotFile } from "../../core/formData";

export interface UpdateUserProps {
  userId: string;
  /**
   * The user this request acts as. Must be the same user as `userId`: a
   * service key updates a user by acting as that user, and the request then
   * behaves exactly as that user's own access token would.
   */
  actingUserId: string;
  name?: string;
  username?: string;
  bio?: string;
  /** The avatar as an image URL. To upload an image, use `avatarFile`. */
  avatar?: string;
  metadata?: Record<string, any>;
  secureMetadata?: Record<string, any>;
  birthdate?: Date;
  location?: {
    latitude: number;
    longitude: number;
  };
  /**
   * A new avatar image, replacing the current one. When present (or
   * `bannerFile` is), the request is sent as `multipart/form-data`.
   */
  avatarFile?: ImageSlotFile;
  /** A new banner image; same contract as {@link UpdateUserProps.avatarFile}. */
  bannerFile?: ImageSlotFile;
  /**
   * Files to remove: the user's `avatarFileId` and/or `bannerFileId` (no other
   * id is accepted). Removing one clears that image. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
}

export async function updateUser(
  client: SublayHttpClient,
  data: UpdateUserProps
): Promise<UserFull> {
  const { userId, avatarFile, bannerFile, ...body } = data;
  const path = `/users/${userId}`;

  if (avatarFile || bannerFile) {
    const formData = new FormData();
    appendFields(formData, body);
    if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile, "banner");
    const response = await client.projectInstance.patch<UserFull>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<UserFull>(path, body);
  return response.data;
}

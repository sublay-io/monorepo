import { SublayHttpClient } from "../../core/client";
import {
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/Space";
import { appendFields, appendImageSlot, type ImageSlotFile } from "../../core/formData";

export interface UpdateSpaceProps {
  spaceId: string;
  name?: string;
  slug?: string;
  description?: string;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * A new avatar image, replacing the current one. When present (or
   * `bannerFile` is), the request is sent as `multipart/form-data`.
   */
  avatarFile?: ImageSlotFile;
  /** A new banner image; same contract as {@link UpdateSpaceProps.avatarFile}. */
  bannerFile?: ImageSlotFile;
  /**
   * Files to remove: the space's `avatarFileId` and/or `bannerFileId` (no other
   * id is accepted). Removing one clears that image. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function updateSpace(
  client: SublayHttpClient,
  data: UpdateSpaceProps
): Promise<SpaceWithPermissions> {
  const { spaceId, avatarFile, bannerFile, ...body } = data;
  const path = `/spaces/${spaceId}`;

  if (avatarFile || bannerFile) {
    const formData = new FormData();
    appendFields(formData, body);
    if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile, "banner");
    const response = await client.projectInstance.patch<SpaceWithPermissions>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<SpaceWithPermissions>(path, body);
  return response.data;
}

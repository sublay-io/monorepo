import { SublayHttpClient } from "../../core/client";
import { SpaceWithPermissions, ReadingPermission, PostingPermission, SpaceVisibility } from "../../interfaces/Space";
import { appendField, appendFields, appendFile, refuseNullWithFile } from "../../core/multipart";
import type { SpaceImageUpload } from "./createSpace";

export interface UpdateSpaceProps {
  spaceId: string;
  // `null` clears it, on a call without a file.
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * New avatar image. When present the request is sent as `multipart/form-data`
   * and the server processes the image per `options`, replacing the old avatar.
   */
  avatarFile?: SpaceImageUpload;
  /** New banner image; same contract as {@link UpdateSpaceProps.avatarFile}. */
  bannerFile?: SpaceImageUpload;
  /**
   * Files to remove: the space's `avatarFileId` and/or `bannerFileId` (no other
   * id is accepted). Removing one clears that image. Works with or without
   * uploads in the same request.
   */
  removeFileIds?: string[];
}

export async function updateSpace(
  client: SublayHttpClient,
  data: UpdateSpaceProps
): Promise<SpaceWithPermissions> {
  const { spaceId, avatarFile, bannerFile, ...body } = data;
  const path = `/spaces/${spaceId}`;

  if (avatarFile || bannerFile) {
    refuseNullWithFile("updateSpace", body);
    const formData = new FormData();

    if (avatarFile) {
      appendFile(formData, "avatarFile", avatarFile.file, { fallback: "avatar" });
      appendField(formData, "avatarFile.options", avatarFile.options);
    }
    if (bannerFile) {
      appendFile(formData, "bannerFile", bannerFile.file, { fallback: "banner" });
      appendField(formData, "bannerFile.options", bannerFile.options);
    }

    appendFields(formData, body);

    const response = await client.projectInstance.patch<SpaceWithPermissions>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<SpaceWithPermissions>(path, body);
  return response.data;
}

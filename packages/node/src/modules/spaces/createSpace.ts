import { SublayHttpClient } from "../../core/client";
import {
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/Space";
import {
  appendFields,
  appendImageSlot,
  refuseNullWithFile,
  type ImageSlotFile,
} from "../../core/formData";

export interface CreateSpaceProps {
  /**
   * The user the service key creates the space as: its creator and first
   * admin, held to that user's own permissions (a child space needs them to
   * be an admin of the parent).
   */
  actingUserId: string;
  // `null` (no name / slug / description) only on a call without a file.
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  parentSpaceId?: string | null; // `null` for a top-level space; not with a file
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * The space's avatar image. When present (or `bannerFile` is), the request
   * is sent as `multipart/form-data` and the server processes the image per
   * `options`.
   */
  avatarFile?: ImageSlotFile;
  /** The space's banner image; same contract as {@link CreateSpaceProps.avatarFile}. */
  bannerFile?: ImageSlotFile;
}

export async function createSpace(
  client: SublayHttpClient,
  data: CreateSpaceProps
): Promise<SpaceWithPermissions> {
  const { avatarFile, bannerFile, ...body } = data;

  if (avatarFile || bannerFile) {
    refuseNullWithFile("createSpace", body);
    const formData = new FormData();
    appendFields(formData, body);
    if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile, "banner");
    const response = await client.projectInstance.post<SpaceWithPermissions>(
      "/spaces",
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<SpaceWithPermissions>("/spaces", body);
  return response.data;
}

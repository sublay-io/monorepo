import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { appendImageSlot, type ImageSlotUpload } from "../../utils/uploads";

export interface CreateSpaceProps {
  name: string;
  slug?: string | null;
  description?: string | null;
  /** The space's avatar image: the file plus its processing options. */
  avatarFile?: ImageSlotUpload;
  /** The space's banner image: the file plus its processing options. */
  bannerFile?: ImageSlotUpload;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  parentSpaceId?: string | null;
}

function useCreateSpace(): (
  props: CreateSpaceProps
) => Promise<SpaceWithPermissions> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const createSpace = useCallback(
    async (props: CreateSpaceProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!props.name) {
        throw new Error("Space name is required");
      }

      // Build FormData if files are present, otherwise use JSON
      const hasFiles = props.avatarFile || props.bannerFile;

      if (hasFiles) {
        const formData = new FormData();

        // Append regular fields
        formData.append("name", props.name);
        if (props.slug !== undefined && props.slug !== null) {
          formData.append("slug", props.slug);
        }
        if (props.description !== undefined && props.description !== null) {
          formData.append("description", props.description);
        }
        if (props.readingPermission) {
          formData.append("readingPermission", props.readingPermission);
        }
        if (props.postingPermission) {
          formData.append("postingPermission", props.postingPermission);
        }
        if (props.visibility) {
          formData.append("visibility", props.visibility);
        }
        if (props.requireJoinApproval !== undefined) {
          formData.append("requireJoinApproval", String(props.requireJoinApproval));
        }
        if (props.metadata) {
          formData.append("metadata", JSON.stringify(props.metadata));
        }
        if (props.nsfw !== undefined) {
          formData.append("nsfw", String(props.nsfw));
        }
        if (props.parentSpaceId) {
          formData.append("parentSpaceId", props.parentSpaceId);
        }

        if (props.avatarFile) {
          appendImageSlot(formData, "avatarFile", props.avatarFile);
        }
        if (props.bannerFile) {
          appendImageSlot(formData, "bannerFile", props.bannerFile);
        }

        const response = await axios.post(`/${projectId}/spaces`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });

        return response.data as SpaceWithPermissions;
      } else {
        // No files: a JSON request
        const response = await axios.post(`/${projectId}/spaces`, {
          name: props.name,
          slug: props.slug,
          description: props.description,
          readingPermission: props.readingPermission,
          postingPermission: props.postingPermission,
          visibility: props.visibility,
          requireJoinApproval: props.requireJoinApproval,
          metadata: props.metadata,
          nsfw: props.nsfw,
          parentSpaceId: props.parentSpaceId,
        });

        return response.data as SpaceWithPermissions;
      }
    },
    [projectId, axios]
  );

  return createSpace;
}

export default useCreateSpace;

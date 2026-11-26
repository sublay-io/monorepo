import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import {
  appendImageSlot,
  withoutNulls,
  type ImageSlotUpload,
} from "../../utils/uploads";
import { SublayError } from "../../errors/SublayError";

export interface CreateSpaceProps {
  // `null` is the same as leaving the field out.
  name?: string | null;
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
        throw new SublayError("No projectId available.");
      }

      // Build FormData if files are present, otherwise use JSON
      const hasFiles = props.avatarFile || props.bannerFile;

      if (hasFiles) {
        const formData = new FormData();
        const fields = withoutNulls({
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

        // Every other field as a string (objects as JSON); a `null` field is
        // left out, the same as not sending it.
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          );
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

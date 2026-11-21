import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/models/Space";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useSpace from "./useSpace";
import { appendImageSlot, type ImageSlotUpload } from "../../utils/uploads";

export interface UpdateSpaceProps {
  spaceId: string;
  update: Partial<{
    name: string;
    /** `null` clears the slug, on an update without files only. */
    slug: string | null;
    description: string | null;
    /** A new avatar image, replacing the current one. */
    avatarFile: ImageSlotUpload;
    /** A new banner image, replacing the current one. */
    bannerFile: ImageSlotUpload;
    /**
     * Files to remove: the space's `avatarFileId` and/or `bannerFileId`.
     * Removing one clears that image.
     */
    removeFileIds: string[];
    readingPermission: ReadingPermission;
    postingPermission: PostingPermission;
    visibility: SpaceVisibility;
    requireJoinApproval: boolean;
    metadata: Record<string, any>;
    nsfw: boolean;
  }>;
}

function useUpdateSpace(): (
  props: UpdateSpaceProps,
) => Promise<SpaceWithPermissions> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { setSpace } = useSpace();

  const updateSpace = useCallback(
    async ({ spaceId, update }: UpdateSpaceProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const { avatarFile, bannerFile, ...fields } = update;
      const path = `/${projectId}/spaces/${spaceId}`;
      let updatedSpace: SpaceWithPermissions;

      if (avatarFile || bannerFile) {
        // Files go as multipart form data; every other field as a string
        // (objects and arrays as JSON).
        const formData = new FormData();
        if (fields.name !== undefined) {
          formData.append("name", fields.name);
        }
        // A multipart field can't carry null, and the server refuses an empty
        // slug: `slug: null` clears the slug only on a JSON update.
        if (fields.slug !== undefined && fields.slug !== null) {
          formData.append("slug", fields.slug);
        }
        if (fields.description !== undefined) {
          formData.append("description", fields.description || "");
        }
        if (fields.readingPermission !== undefined) {
          formData.append("readingPermission", fields.readingPermission);
        }
        if (fields.postingPermission !== undefined) {
          formData.append("postingPermission", fields.postingPermission);
        }
        if (fields.visibility !== undefined) {
          formData.append("visibility", fields.visibility);
        }
        if (fields.requireJoinApproval !== undefined) {
          formData.append(
            "requireJoinApproval",
            String(fields.requireJoinApproval),
          );
        }
        if (fields.metadata !== undefined) {
          formData.append("metadata", JSON.stringify(fields.metadata));
        }
        if (fields.nsfw !== undefined) {
          formData.append("nsfw", String(fields.nsfw));
        }
        if (fields.removeFileIds !== undefined) {
          formData.append("removeFileIds", JSON.stringify(fields.removeFileIds));
        }
        if (avatarFile) appendImageSlot(formData, "avatarFile", avatarFile);
        if (bannerFile) appendImageSlot(formData, "bannerFile", bannerFile);

        const response = await axios.patch(path, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        updatedSpace = response.data as SpaceWithPermissions;
      } else {
        // No files: a JSON request.
        const response = await axios.patch(path, fields);
        updatedSpace = response.data as SpaceWithPermissions;
      }

      // The response carries the caller's server permissions but not
      // `parentSpace` / `childSpaces`, so merge it onto the provider's space.
      setSpace?.((prev) =>
        prev && prev.id === updatedSpace.id
          ? { ...prev, ...updatedSpace }
          : prev,
      );
      return updatedSpace;
    },
    [projectId, axios, setSpace],
  );

  return updateSpace;
}

export default useUpdateSpace;

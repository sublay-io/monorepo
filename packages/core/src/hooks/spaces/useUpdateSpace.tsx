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
import {
  appendImageSlot,
  refuseNullWithFile,
  type ImageSlotUpload,
} from "../../utils/uploads";
import { SublayError } from "../../errors/SublayError";

export interface UpdateSpaceProps {
  spaceId: string;
  update: Partial<{
    // `null` clears it, on an update without a file.
    name: string | null;
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
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const { avatarFile, bannerFile, ...fields } = update;
      const path = `/${projectId}/spaces/${spaceId}`;
      let updatedSpace: SpaceWithPermissions;

      if (avatarFile || bannerFile) {
        // Files go as multipart form data; every other field as a string
        // (objects and arrays as JSON). A multipart field can't carry null.
        refuseNullWithFile("updateSpace", fields);
        const formData = new FormData();
        for (const [key, value] of Object.entries(fields)) {
          if (value === undefined) continue;
          formData.append(
            key,
            typeof value === "object" ? JSON.stringify(value) : String(value),
          );
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

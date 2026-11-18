import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface ModerateSpaceEntityProps {
  spaceId: string;
  entityId: string;
  action: "approve" | "remove";
  reason?: string;
}

interface ModerateResponse {
  moderationStatus: "approved" | "removed";
}

/**
 * Hook to moderate an entity within a space (approve or remove).
 * Requires space moderator permissions.
 *
 * @example
 * const moderateSpaceEntity = useModerateSpaceEntity();
 *
 * await moderateSpaceEntity({
 *   spaceId: "space-uuid",
 *   entityId: "entity-uuid",
 *   action: "remove",
 *   reason: "Violates community guidelines"
 * });
 */
function useModerateSpaceEntity(): (props: ModerateSpaceEntityProps) => Promise<ModerateResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const moderateSpaceEntity = useCallback(
    async ({
      spaceId,
      entityId,
      action,
      reason,
    }: ModerateSpaceEntityProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !entityId) {
        throw new Error("spaceId and entityId are required.");
      }

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/entities/${entityId}/moderation`,
        { action, reason }
      );

      return response.data as ModerateResponse;
    },
    [projectId, axios]
  );

  return moderateSpaceEntity;
}

export default useModerateSpaceEntity;

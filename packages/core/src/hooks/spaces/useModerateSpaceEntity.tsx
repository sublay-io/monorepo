import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface ModerateSpaceEntityProps {
  spaceId: string;
  entityId: string;
  action: "approve" | "remove";
  reason?: string;
}

interface ModerateResponse {
  // null when the entity was deleted by its owner and never moderated:
  // deleted content takes no moderation change, so the response carries its
  // existing status.
  moderationStatus: "approved" | "removed" | null;
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
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !entityId) {
        throw new SublayError("spaceId and entityId are required.");
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

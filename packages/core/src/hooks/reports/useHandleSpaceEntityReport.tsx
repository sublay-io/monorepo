import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface HandleSpaceEntityReportParams {
  spaceId: string;
  reportId: string;
  entityId: string;
  actions: Array<"remove-entity" | "ban-user" | "dismiss">;
  summary: string;
  reason?: string;
}

/**
 * Hook to handle entity reports at the space level
 * Space moderators can: remove entity, ban user from space, dismiss
 *
 * @example
 * const handleSpaceEntityReport = useHandleSpaceEntityReport();
 *
 * await handleSpaceEntityReport({
 *   spaceId: "space-uuid",
 *   reportId: "report-uuid",
 *   entityId: "entity-uuid",
 *   actions: ["remove-entity", "ban-user"],
 *   summary: "Removed spam content and banned user",
 *   reason: "Spamming"
 * });
 */
function useHandleSpaceEntityReport(): (params: HandleSpaceEntityReportParams) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const handleSpaceEntityReport = useCallback(
    async ({
      spaceId,
      reportId,
      entityId,
      actions,
      summary,
      reason,
    }: HandleSpaceEntityReportParams) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !reportId) {
        throw new Error("spaceId and reportId are required");
      }

      // The server answers 204 with no body.
      await axios.patch(
        `/${projectId}/spaces/${spaceId}/reports/entity/${reportId}`,
        {
          entityId,
          actions,
          summary,
          reason,
        }
      );
    },
    [projectId, axios]
  );

  return handleSpaceEntityReport;
}

export default useHandleSpaceEntityReport;

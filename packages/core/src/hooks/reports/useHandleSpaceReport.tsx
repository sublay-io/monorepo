import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

/**
 * An action a space moderator takes on a report. Which ones a report accepts
 * depends on what was reported: an entity report takes `remove-entity`,
 * `ban-user`, `dismiss`; a comment report `remove-comment`, `ban-user`,
 * `dismiss`; a chat message report `remove-message`, `ban-user`, `dismiss`.
 */
export type SpaceReportAction =
  | "remove-entity"
  | "remove-comment"
  | "remove-message"
  | "ban-user"
  | "dismiss";

export interface HandleSpaceReportProps {
  spaceId: string;
  reportId: string;
  actions: SpaceReportAction[];
  /** What the moderator did, stored on the report. Required for every report type; up to 1000 characters. */
  summary: string;
  /** Why the author is banned, with `ban-user`. Up to 1000 characters. */
  reason?: string;
}

/**
 * Hook to handle a report in a space, whatever was reported (entity, comment
 * or chat message). The server reads the reported content and its author from
 * the report, so the request names neither; `ban-user` bans the reported
 * content's author from the space. The moderator is the signed-in user.
 *
 * @example
 * const handleSpaceReport = useHandleSpaceReport();
 *
 * await handleSpaceReport({
 *   spaceId: "space-uuid",
 *   reportId: "report-uuid",
 *   actions: ["remove-entity", "ban-user"],
 *   summary: "Removed spam content and banned user",
 *   reason: "Spamming",
 * });
 */
function useHandleSpaceReport(): (
  params: HandleSpaceReportProps
) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const handleSpaceReport = useCallback(
    async ({
      spaceId,
      reportId,
      actions,
      summary,
      reason,
    }: HandleSpaceReportProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !reportId) {
        throw new Error("spaceId and reportId are required");
      }

      // The server answers 204 with no body.
      await axios.patch(`/${projectId}/spaces/${spaceId}/reports/${reportId}`, {
        actions,
        summary,
        reason,
      });
    },
    [projectId, axios]
  );

  return handleSpaceReport;
}

export default useHandleSpaceReport;

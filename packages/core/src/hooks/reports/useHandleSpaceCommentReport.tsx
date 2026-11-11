import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface HandleSpaceCommentReportParams {
  spaceId: string;
  reportId: string;
  commentId: string;
  actions: Array<"remove-comment" | "ban-user" | "dismiss">;
  summary: string;
  reason?: string;
}

/**
 * Hook to handle comment reports at the space level
 * Space moderators can: remove comment, ban user from space, dismiss
 *
 * @example
 * const handleSpaceCommentReport = useHandleSpaceCommentReport();
 *
 * await handleSpaceCommentReport({
 *   spaceId: "space-uuid",
 *   reportId: "report-uuid",
 *   commentId: "comment-uuid",
 *   actions: ["remove-comment"],
 *   summary: "Removed inappropriate comment"
 * });
 */
function useHandleSpaceCommentReport(): (params: HandleSpaceCommentReportParams) => Promise<void> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const handleSpaceCommentReport = useCallback(
    async ({
      spaceId,
      reportId,
      commentId,
      actions,
      summary,
      reason,
    }: HandleSpaceCommentReportParams) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId || !reportId) {
        throw new Error("spaceId and reportId are required");
      }

      // The server answers 204 with no body.
      await axios.patch(
        `/${projectId}/spaces/${spaceId}/reports/comment/${reportId}`,
        {
          commentId,
          actions,
          summary,
          reason,
        }
      );
    },
    [projectId, axios]
  );

  return handleSpaceCommentReport;
}

export default useHandleSpaceCommentReport;

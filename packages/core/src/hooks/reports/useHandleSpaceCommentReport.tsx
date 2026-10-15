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

export interface HandleReportResponse {
  message: string;
  code: string;
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
function useHandleSpaceCommentReport(): (params: HandleSpaceCommentReportParams) => Promise<HandleReportResponse> {
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

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/reports/comment/${reportId}`,
        {
          commentId,
          actions,
          summary,
          reason,
        }
      );

      return response.data as HandleReportResponse;
    },
    [projectId, axios]
  );

  return handleSpaceCommentReport;
}

export default useHandleSpaceCommentReport;

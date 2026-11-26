import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SublayError } from "../../errors/SublayError";

export interface ModerateSpaceCommentProps {
  spaceId: string;
  commentId: string;
  action: "approve" | "remove";
  reason?: string;
}

interface ModerateResponse {
  // null when the comment was deleted by its author and never moderated:
  // deleted content takes no moderation change, so the response carries its
  // existing status.
  moderationStatus: "approved" | "removed" | null;
}

/**
 * Hook to moderate a comment within a space (approve or remove).
 * Requires space moderator permissions.
 *
 * @example
 * const moderateSpaceComment = useModerateSpaceComment();
 *
 * await moderateSpaceComment({
 *   spaceId: "space-uuid",
 *   commentId: "comment-uuid",
 *   action: "remove",
 *   reason: "Spam content"
 * });
 */
function useModerateSpaceComment(): (props: ModerateSpaceCommentProps) => Promise<ModerateResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const moderateSpaceComment = useCallback(
    async ({
      spaceId,
      commentId,
      action,
      reason,
    }: ModerateSpaceCommentProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId || !commentId) {
        throw new SublayError("spaceId and commentId are required.");
      }

      const response = await axios.patch(
        `/${projectId}/spaces/${spaceId}/comments/${commentId}/moderation`,
        { action, reason }
      );

      return response.data as ModerateResponse;
    },
    [projectId, axios]
  );

  return moderateSpaceComment;
}

export default useModerateSpaceComment;

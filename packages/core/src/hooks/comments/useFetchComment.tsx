import { useCallback } from "react";
import useProject from "../projects/useProject";
import { Comment, CommentIncludeParam } from "../../interfaces/models/Comment";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";
import { SublayError } from "../../errors/SublayError";

export interface FetchCommentProps extends SpaceReputationContextParams {
  commentId: string;
  include?: CommentIncludeParam;
}

function useFetchComment(): (props: FetchCommentProps) => Promise<Comment> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchComment = useCallback(
    async ({ commentId, include, spaceReputation }: FetchCommentProps) => {
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!commentId) {
        throw new SublayError("No comment ID passed");
      }

      const params: Record<string, any> = {
        ...buildSpaceReputationParams({ spaceReputation }),
      };

      if (include) {
        params.include = Array.isArray(include) ? include.join(',') : include;
      }

      const response = await axios.get(`/${projectId}/comments/${commentId}`, {
        params,
      });

      return response.data as Comment;
    },
    [axios, projectId]
  );

  return fetchComment;
}

export default useFetchComment;

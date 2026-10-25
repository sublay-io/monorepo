import { useCallback } from "react";
import useProject from "../projects/useProject";
import { Comment, CommentIncludeParam } from "../../interfaces/models/Comment";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";

export interface FetchCommentByForeignIdProps extends SpaceReputationContextParams {
  foreignId: string;
  include?: CommentIncludeParam;
}

function useFetchCommentByForeignId(): (props: FetchCommentByForeignIdProps) => Promise<Comment> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchCommentByForeignId = useCallback(
    async ({
      foreignId,
      include,
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }: FetchCommentByForeignIdProps) => {
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!foreignId) {
        throw new Error("No foreign ID passed");
      }

      const params: Record<string, any> = {
        foreignId,
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };

      if (include) {
        params.include = Array.isArray(include) ? include.join(',') : include;
      }

      const response = await axios.get(`/${projectId}/comments/by-foreign-id`, {
        params,
      });

      return response.data as Comment;
    },
    [axios, projectId]
  );

  return fetchCommentByForeignId;
}

export default useFetchCommentByForeignId;

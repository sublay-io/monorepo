import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  Entity,
  EntityIncludeParam,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface FetchEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  createIfNotFound?: boolean;
  include?: EntityIncludeParam;
}

function useFetchEntityByForeignId(): (props: FetchEntityByForeignIdProps) => Promise<Entity> {
    const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchEntityByForeignId = useCallback(
    async ({ foreignId, createIfNotFound, include, topCommentsLimit, topCommentsSortByReaction }: FetchEntityByForeignIdProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!foreignId) {
        throw new Error("Please pass foreignId");
      }

      const response = await axios.get(`/${projectId}/entities/by-foreign-id`, {
        params: {
          foreignId,
          createIfNotFound,
          include: Array.isArray(include) ? include.join(",") : include,
          ...(topCommentsLimit !== undefined ? { topCommentsLimit } : {}),
          ...(topCommentsSortByReaction ? { topCommentsSortByReaction } : {}),
        },
      });

      return response.data as Entity;
    },
    [projectId]
  );

  return fetchEntityByForeignId;
}

export default useFetchEntityByForeignId;

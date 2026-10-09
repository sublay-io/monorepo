import { useCallback } from "react";
import { sendableTopCommentsParams } from "../../utils/topCommentsParams";
import useProject from "../projects/useProject";
import {
  Entity,
  EntityIncludeParam,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface FetchEntityByShortIdProps extends TopCommentsParams {
  shortId: string;
  include?: EntityIncludeParam;
}

function useFetchEntityByShortId(): (props: FetchEntityByShortIdProps) => Promise<Entity> {
    const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchEntityByShortId = useCallback(
    async ({ shortId, include, topCommentsLimit, topCommentsSortByReaction }: FetchEntityByShortIdProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!shortId) {
        throw new Error("Please pass shortId");
      }

      const response = await axios.get(`/${projectId}/entities/by-short-id`, {
        params: {
          shortId,
          include: Array.isArray(include) ? include.join(",") : include,
          // Only with include=topComments (the server 400s them otherwise).
          ...sendableTopCommentsParams(include, topCommentsLimit, topCommentsSortByReaction),
        },
      });

      return response.data as Entity;
    },
    [projectId]
  );

  return fetchEntityByShortId;
}

export default useFetchEntityByShortId;

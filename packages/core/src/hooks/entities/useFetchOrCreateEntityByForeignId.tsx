import { useCallback } from "react";
import { sendableTopCommentsParams } from "../../utils/topCommentsParams";
import useProject from "../projects/useProject";
import {
  Entity,
  EntityIncludeParam,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import useAxiosPrivate from "../../config/useAxiosPrivate";

export interface FetchOrCreateEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  include?: EntityIncludeParam;
}

export interface FetchOrCreateEntityByForeignIdResult {
  entity: Entity;
  /** `true` when this call created the entity (HTTP 201), `false` when it existed (200). */
  created: boolean;
}

/**
 * Returns the entity with this foreign id, or creates an app-owned one
 * carrying only the foreign id when there is none (`GET
 * /entities/by-foreign-id?createIfNotFound=true`).
 *
 * Unlike the other hooks, which resolve to the plain record, this one
 * resolves to `{ entity, created }`: whether the call created the entity is
 * part of what a fetch-or-create answers. `created` is true when the server
 * answered 201.
 */
function useFetchOrCreateEntityByForeignId(): (
  props: FetchOrCreateEntityByForeignIdProps
) => Promise<FetchOrCreateEntityByForeignIdResult> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchOrCreateEntityByForeignId = useCallback(
    async ({
      foreignId,
      include,
      topCommentsLimit,
      topCommentsSortByReaction,
    }: FetchOrCreateEntityByForeignIdProps): Promise<FetchOrCreateEntityByForeignIdResult> => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!foreignId) {
        throw new Error("Please pass foreignId");
      }

      const response = await axios.get(`/${projectId}/entities/by-foreign-id`, {
        params: {
          foreignId,
          createIfNotFound: true,
          include: Array.isArray(include) ? include.join(",") : include,
          // Only with include=topComments (the server 400s them otherwise).
          ...sendableTopCommentsParams(include, topCommentsLimit, topCommentsSortByReaction),
        },
      });

      // 201 is an entity this call created; 200 is an existing one (also the
      // loser of a concurrent create).
      return {
        entity: response.data as Entity,
        created: response.status === 201,
      };
    },
    [projectId]
  );

  return fetchOrCreateEntityByForeignId;
}

export default useFetchOrCreateEntityByForeignId;

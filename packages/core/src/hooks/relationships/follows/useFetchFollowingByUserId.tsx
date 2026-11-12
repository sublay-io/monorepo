import { useCallback } from "react";
import { buildSearchParams } from "../../../utils/searchParams";
import useProject from "../../projects/useProject";
import type { FollowRow } from "../../../interfaces/models/Follow";
import { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import { SpaceReputationUserParams } from "../../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface FetchFollowingByUserIdParams
  extends SpaceReputationUserParams,
    UserSearchParams {
  userId: string;
  page?: number;
  limit?: number;
}

function useFetchFollowingByUserId(): (params: FetchFollowingByUserIdParams) => Promise<PaginatedResponse<FollowRow>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchFollowingByUserId = useCallback(
    async ({ userId, page = 1, limit = 20, query, searchFields, spaceReputation, spaceReputationId, spaceReputationDescendants }: FetchFollowingByUserIdParams) => {
      if (!userId) {
        throw new Error("No userId provided.");
      }

      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const params: Record<string, any> = {
        page,
        limit,
        ...buildSearchParams(query, searchFields),
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };

      const response = await axios.get<PaginatedResponse<FollowRow>>(
        `/${projectId}/users/${userId}/following`,
        {
          params,
        }
      );

      return response.data;
    },
    [axios, projectId]
  );

  return fetchFollowingByUserId;
}

export default useFetchFollowingByUserId;

import { useCallback } from "react";
import { buildSearchParams } from "../../../utils/searchParams";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { FollowRow } from "../../../interfaces/models/Follow";
import { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import { SpaceReputationUserParams } from "../../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface FetchFollowingParams
  extends SpaceReputationUserParams,
    UserSearchParams {
  page?: number;
  limit?: number;
}

function useFetchFollowing(): (params?: FetchFollowingParams) => Promise<PaginatedResponse<FollowRow>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchFollowing = useCallback(
    async ({ page = 1, limit = 20, query, searchFields, spaceReputation, spaceReputationId, spaceReputationDescendants }: FetchFollowingParams = {}) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!user) {
        throw new Error("No user is logged in.");
      }

      const response = await axios.get<PaginatedResponse<FollowRow>>(
        `/${projectId}/follows/following`,
        {
          params: {
            page,
            limit,
            ...buildSearchParams(query, searchFields),
            ...buildSpaceReputationParams({
              spaceReputation,
              spaceReputationId,
              spaceReputationDescendants,
            }),
          },
        }
      );

      return response.data;
    },
    [axios, projectId, user]
  );

  return fetchFollowing;
}

export default useFetchFollowing;

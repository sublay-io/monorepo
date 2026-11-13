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

export interface FetchFollowersParams
  extends SpaceReputationUserParams,
    UserSearchParams {
  page?: number;
  limit?: number;
}

function useFetchFollowers(): (params?: FetchFollowersParams) => Promise<PaginatedResponse<FollowRow>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchFollowers = useCallback(
    async ({ page = 1, limit = 20, query, searchFields, spaceReputation, spaceReputationId, spaceReputationDescendants }: FetchFollowersParams = {}) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!user) {
        throw new Error("No user is logged in.");
      }

      const response = await axios.get<PaginatedResponse<FollowRow>>(
        `/${projectId}/follows/followers`,
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

  return fetchFollowers;
}

export default useFetchFollowers;

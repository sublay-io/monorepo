import { useCallback } from "react";
import { buildSearchParams } from "../../../utils/searchParams";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { AcceptedConnectionRow } from "../../../interfaces/models/Connection";
import { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import { SpaceReputationUserParams } from "../../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface FetchConnectionsParams
  extends SpaceReputationUserParams,
    UserSearchParams {
  page?: number;
  limit?: number;
}

function useFetchConnections(): (props?: FetchConnectionsParams) => Promise<PaginatedResponse<AcceptedConnectionRow>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchConnections = useCallback(
    async (
      props: FetchConnectionsParams = {}
    ): Promise<PaginatedResponse<AcceptedConnectionRow>> => {
      const { page = 1, limit = 20, query, searchFields, spaceReputation, spaceReputationId, spaceReputationDescendants } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!user) {
        throw new Error("No user is logged in");
      }

      const response = await axios.get<PaginatedResponse<AcceptedConnectionRow>>(
        `/${projectId}/connections`,
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

  return fetchConnections;
}

export default useFetchConnections;

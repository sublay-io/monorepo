import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { ConnectionRow } from "../../../interfaces/models/Connection";
import { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import { SublayError } from "../../../errors/SublayError";

export interface FetchSentPendingConnectionsParams {
  page?: number;
  limit?: number;
}

function useFetchSentPendingConnections(): (props?: FetchSentPendingConnectionsParams) => Promise<PaginatedResponse<ConnectionRow>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchSentPendingConnections = useCallback(
    async (
      props: FetchSentPendingConnectionsParams = {}
    ): Promise<PaginatedResponse<ConnectionRow>> => {
      const { page = 1, limit = 20 } = props;
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!user) {
        throw new SublayError("No user is logged in");
      }

      const response = await axios.get<PaginatedResponse<ConnectionRow>>(
        `/${projectId}/connections/pending/sent`,
        {
          params: {
            page,
            limit,
          },
        }
      );

      return response.data;
    },
    [axios, projectId, user]
  );

  return fetchSentPendingConnections;
}

export default useFetchSentPendingConnections;
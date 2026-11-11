import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { BlockRow } from "../../../interfaces/models/Block";
import { PaginatedResponse } from "../../../interfaces/PaginatedResponse";

export interface FetchBlockedUsersParams {
  page?: number;
  limit?: number;
}

function useFetchBlockedUsers(): (props?: FetchBlockedUsersParams) => Promise<PaginatedResponse<BlockRow>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchBlockedUsers = useCallback(
    async (
      props: FetchBlockedUsersParams = {}
    ): Promise<PaginatedResponse<BlockRow>> => {
      const { page = 1, limit = 20 } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!user) {
        throw new Error("No user is logged in");
      }

      const response = await axios.get<PaginatedResponse<BlockRow>>(
        `/${projectId}/blocks`,
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

  return fetchBlockedUsers;
}

export default useFetchBlockedUsers;

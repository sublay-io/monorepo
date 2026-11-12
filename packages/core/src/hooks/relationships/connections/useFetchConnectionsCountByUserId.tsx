import { useCallback } from "react";
import useProject from "../../projects/useProject";
import useAxiosPrivate from "../../../config/useAxiosPrivate";

export interface FetchConnectionsCountByUserIdParams {
  userId: string;
}

function useFetchConnectionsCountByUserId(): (props: FetchConnectionsCountByUserIdParams) => Promise<number> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchConnectionsCountByUserId = useCallback(
    async (
      props: FetchConnectionsCountByUserIdParams
    ): Promise<number> => {
      const { userId } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!userId) {
        throw new Error("No user ID was provided");
      }

      const response = await axios.get<{ count: number }>(`/${projectId}/users/${userId}/connections-count`);

      return response.data.count;
    },
    [axios, projectId]
  );

  return fetchConnectionsCountByUserId;
}

export default useFetchConnectionsCountByUserId;

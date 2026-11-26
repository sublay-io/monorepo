import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { SublayError } from "../../../errors/SublayError";

function useFetchConnectionsCount(): () => Promise<number> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchConnectionsCount = useCallback(
    async (): Promise<number> => {
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!user) {
        throw new SublayError("No user is logged in");
      }

      const response = await axios.get<{ count: number }>(
        `/${projectId}/connections/connections-count`
      );

      return response.data.count;
    },
    [axios, projectId, user]
  );

  return fetchConnectionsCount;
}

export default useFetchConnectionsCount;
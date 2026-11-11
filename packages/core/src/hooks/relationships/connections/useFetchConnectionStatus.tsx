import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { ConnectionStatus } from "../../../interfaces/models/Connection";

export interface FetchConnectionStatusProps {
  userId: string;
}

function useFetchConnectionStatus(): (props: FetchConnectionStatusProps) => Promise<ConnectionStatus> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const getConnectionStatus = useCallback(
    async (props: FetchConnectionStatusProps): Promise<ConnectionStatus> => {
      const { userId } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!user) {
        throw new Error("No user is logged in");
      }

      if (!userId) {
        throw new Error("No user ID was provided");
      }

      if (userId === user.id) {
        throw new Error("Cannot check connection status with yourself");
      }

      const response = await axios.get<ConnectionStatus>(
        `/${projectId}/users/${userId}/connection`
      );

      return response.data;
    },
    [axios, projectId, user]
  );

  return getConnectionStatus;
}

export default useFetchConnectionStatus;
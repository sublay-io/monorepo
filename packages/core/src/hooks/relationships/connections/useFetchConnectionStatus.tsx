import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { ConnectionStatus } from "../../../interfaces/models/Connection";
import { SublayError } from "../../../errors/SublayError";

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
        throw new SublayError("No project specified");
      }

      if (!user) {
        throw new SublayError("No user is logged in");
      }

      if (!userId) {
        throw new SublayError("No user ID was provided");
      }

      if (userId === user.id) {
        throw new SublayError("Cannot check connection status with yourself");
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
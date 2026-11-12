import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import type { ConnectionRequestParams, ConnectionRow } from "../../../interfaces/models/Connection";

function useRequestConnection(): (props: ConnectionRequestParams) => Promise<ConnectionRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const requestConnection = useCallback(
    async (props: ConnectionRequestParams): Promise<ConnectionRow> => {
      const { userId, message } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!userId) {
        throw new Error("No user ID was provided");
      }

      // `user` on the returned row is the receiver; `type` is "sent".
      const response = await axios.post<ConnectionRow>(
        `/${projectId}/users/${userId}/connection`,
        { message }
      );

      return response.data;
    },
    [axios, projectId]
  );

  return requestConnection;
}

export default useRequestConnection;
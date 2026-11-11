import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { ConnectionRow } from "../../../interfaces/models/Connection";

export interface DeclineConnectionProps {
  connectionId: string;
}

function useDeclineConnection(): (props: DeclineConnectionProps) => Promise<ConnectionRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const declineConnection = useCallback(
    async (props: DeclineConnectionProps): Promise<ConnectionRow> => {
      const { connectionId } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!user) {
        throw new Error("No user is logged in");
      }

      if (!connectionId) {
        throw new Error("No connection ID was provided");
      }

      // The row from the receiver's (caller's) side: `user` is the requester.
      const response = await axios.patch<ConnectionRow>(
        `/${projectId}/connections/${connectionId}/decline`,
        {}
      );

      return response.data;
    },
    [axios, projectId, user]
  );

  return declineConnection;
}

export default useDeclineConnection;
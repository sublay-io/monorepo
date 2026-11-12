import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { ConnectionRow } from "../../../interfaces/models/Connection";

export interface AcceptConnectionProps {
  connectionId: string;
}

function useAcceptConnection(): (props: AcceptConnectionProps) => Promise<ConnectionRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const acceptConnection = useCallback(
    async (props: AcceptConnectionProps): Promise<ConnectionRow> => {
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
        `/${projectId}/connections/${connectionId}/accept`,
        {}
      );

      return response.data;
    },
    [axios, projectId, user]
  );

  return acceptConnection;
}

export default useAcceptConnection;
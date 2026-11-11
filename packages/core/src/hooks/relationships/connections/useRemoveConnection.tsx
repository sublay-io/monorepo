import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";

export interface RemoveConnectionProps {
  connectionId: string;
}

function useRemoveConnection(): (props: RemoveConnectionProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const removeConnection = useCallback(
    async (props: RemoveConnectionProps): Promise<void> => {
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

      // Withdraws a pending request or removes an accepted connection. The
      // server answers 204 with no body.
      await axios.delete(`/${projectId}/connections/${connectionId}`);
    },
    [axios, projectId, user]
  );

  return removeConnection;
}

export default useRemoveConnection;
import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";

export interface RemoveConnectionByUserIdProps {
  userId: string;
}

function useRemoveConnectionByUserId(): (props: RemoveConnectionByUserIdProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const removeConnectionByUserId = useCallback(
    async (props: RemoveConnectionByUserIdProps): Promise<void> => {
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
        throw new Error("Cannot disconnect from yourself");
      }

      // One call for every case, answered 204 with no body: a request
      // `userId` sent the caller is declined (the row stays, `declined`); the
      // caller's own pending request is withdrawn and an accepted connection
      // removed (the row is deleted).
      await axios.delete(`/${projectId}/users/${userId}/connection`);
    },
    [axios, projectId, user]
  );

  return removeConnectionByUserId;
}

export default useRemoveConnectionByUserId;
import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { SublayError } from "../../../errors/SublayError";

export interface UnfollowUserByUserIdProps {
  userId: string;
}

function useUnfollowUserByUserId(): (props: UnfollowUserByUserIdProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const unfollowUserByUserId = useCallback(
    async (props: UnfollowUserByUserIdProps) => {
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
        throw new SublayError("Users can't unfollow themselves");
      }

      await axios.delete(`/${projectId}/users/${userId}/follow`);
    },
    [axios, projectId, user]
  );

  return unfollowUserByUserId;
}

export default useUnfollowUserByUserId;

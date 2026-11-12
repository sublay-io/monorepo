import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import type { FollowRow } from "../../../interfaces/models/Follow";

export interface FollowUserProps {
  userId: string;
}

function useFollowUser(): (props: FollowUserProps) => Promise<FollowRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const followUser = useCallback(
    async (props: FollowUserProps) => {
      const { userId } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!userId) {
        throw new Error("No user ID was provided");
      }

      // `user` on the returned row is the followed user.
      const response = await axios.post<FollowRow>(
        `/${projectId}/users/${userId}/follow`,
        {}
      );
      return response.data;
    },
    [axios, projectId]
  );

  return followUser;
}

export default useFollowUser;

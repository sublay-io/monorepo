import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { FollowStatus } from "../../../interfaces/models/Follow";
import { SublayError } from "../../../errors/SublayError";

export interface FetchFollowStatusProps {
  userId: string;
}

function useFetchFollowStatus(): (props: FetchFollowStatusProps) => Promise<FollowStatus> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchFollowStatus = useCallback(
    async (props: FetchFollowStatusProps) => {
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
        throw new SublayError("Users don't follow themselves");
      }

      const response = await axios.get<FollowStatus>(
        `/${projectId}/users/${userId}/follow`
      );
      return response.data;
    },
    [axios, projectId, user?.id]
  );

  return fetchFollowStatus;
}

export default useFetchFollowStatus;

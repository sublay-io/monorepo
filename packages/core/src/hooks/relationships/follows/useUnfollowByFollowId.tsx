import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { SublayError } from "../../../errors/SublayError";

export interface UnfollowByFollowIdProps {
  followId: string;
}

function useUnfollowByFollowId(): (props: UnfollowByFollowIdProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const unfollowByFollowId = useCallback(
    async (props: UnfollowByFollowIdProps) => {
      const { followId } = props;
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!user) {
        throw new SublayError("No user is logged in");
      }

      if (!followId) {
        throw new SublayError("No follow ID was provided");
      }

      await axios.delete(`/${projectId}/follows/${followId}`);
    },
    [axios, projectId, user]
  );

  return unfollowByFollowId;
}

export default useUnfollowByFollowId;

import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import type { BlockStatus } from "../../../interfaces/models/Block";
import { SublayError } from "../../../errors/SublayError";

export interface FetchBlockStatusProps {
  userId: string;
}

function useFetchBlockStatus(): (props: FetchBlockStatusProps) => Promise<BlockStatus> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchBlockStatus = useCallback(
    async (props: FetchBlockStatusProps) => {
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
        throw new SublayError("Users don't block themselves");
      }

      // The acting user's OUTBOUND state only — do *I* block `:userId`. It
      // never reveals whether `:userId` blocked me.
      const response = await axios.get<BlockStatus>(
        `/${projectId}/users/${userId}/block`
      );
      return response.data;
    },
    [axios, projectId, user?.id]
  );

  return fetchBlockStatus;
}

export default useFetchBlockStatus;

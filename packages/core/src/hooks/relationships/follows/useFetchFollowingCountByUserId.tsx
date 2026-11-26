import { useCallback } from "react";
import useProject from "../../projects/useProject";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import { SublayError } from "../../../errors/SublayError";

export interface FetchFollowingCountByUserIdProps {
  userId: string;
}

function useFetchFollowingCountByUserId(): (props: FetchFollowingCountByUserIdProps) => Promise<number> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchFollowingCountByUserId = useCallback(
    async ({ userId }: FetchFollowingCountByUserIdProps) => {
      if (!userId) {
        throw new SublayError("No userId provided.");
      }

      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const response = await axios.get<{ count: number }>(
        `/${projectId}/users/${userId}/following-count`
      );

      return response.data.count;
    },
    [axios, projectId]
  );

  return fetchFollowingCountByUserId;
}

export default useFetchFollowingCountByUserId;

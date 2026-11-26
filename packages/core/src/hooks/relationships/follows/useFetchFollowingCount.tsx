import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { SublayError } from "../../../errors/SublayError";

function useFetchFollowingCount(): () => Promise<number> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchFollowingCount = useCallback(
    async () => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!user) {
        throw new SublayError("No user is logged in.");
      }

      const response = await axios.get<{ count: number }>(
        `/${projectId}/follows/following-count`
      );

      return response.data.count;
    },
    [axios, projectId, user]
  );

  return fetchFollowingCount;
}

export default useFetchFollowingCount;
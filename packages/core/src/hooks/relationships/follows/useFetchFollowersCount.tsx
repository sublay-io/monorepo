import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { SublayError } from "../../../errors/SublayError";

function useFetchFollowersCount(): () => Promise<number> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const fetchFollowersCount = useCallback(
    async () => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!user) {
        throw new SublayError("No user is logged in.");
      }

      const response = await axios.get<{ count: number }>(
        `/${projectId}/follows/followers-count`
      );

      return response.data.count;
    },
    [axios, projectId, user]
  );

  return fetchFollowersCount;
}

export default useFetchFollowersCount;
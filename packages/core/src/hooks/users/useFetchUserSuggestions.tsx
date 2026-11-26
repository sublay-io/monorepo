import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { User } from "../../interfaces/models/User";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";
import { SublayError } from "../../errors/SublayError";

export interface FetchUserSuggestionsProps extends SpaceReputationUserParams {
  query: string;
}

function useFetchUserSuggestions(): (props: FetchUserSuggestionsProps) => Promise<User[]> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchUserSuggestions = useCallback(
    async ({ query, spaceReputation }: FetchUserSuggestionsProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      const params: Record<string, any> = {
        query,
        ...buildSpaceReputationParams({ spaceReputation }),
      };

      // The server answers `{ data: User[] }`; the hook returns the array.
      const response = await axios.get<{ data: User[] }>(
        `/${projectId}/users/suggestions`,
        { params }
      );

      return response.data.data;
    },
    [axios, projectId]
  );

  return fetchUserSuggestions;
}

export default useFetchUserSuggestions;

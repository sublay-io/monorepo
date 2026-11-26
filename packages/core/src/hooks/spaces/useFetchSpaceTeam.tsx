import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  SpaceMemberWithUser,
  SpaceTeamResponse,
} from "../../interfaces/models/SpaceMember";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";
import { SublayError } from "../../errors/SublayError";

export interface FetchSpaceTeamProps extends SpaceReputationContextParams {
  spaceId: string;
}

// Fetches all admins and moderators of a space (no pagination)
function useFetchSpaceTeam(): (props: FetchSpaceTeamProps) => Promise<SpaceMemberWithUser[]> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceTeam = useCallback(
    async ({ spaceId, spaceReputation }: FetchSpaceTeamProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }

      if (!spaceId) {
        throw new SublayError("Please pass a spaceId");
      }

      const url = `/${projectId}/spaces/${spaceId}/team`;

      const params: Record<string, any> = {
        ...buildSpaceReputationParams({ spaceReputation }),
      };

      const response = await axios.get<SpaceTeamResponse>(url, {
        params,
      });

      return response.data.data;
    },
    [projectId, axios]
  );

  return fetchSpaceTeam;
}

export default useFetchSpaceTeam;

import { useCallback } from "react";
import useProject from "../projects/useProject";
import { SpaceMemberWithUser } from "../../interfaces/models/SpaceMember";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";

export interface FetchSpaceTeamProps extends SpaceReputationContextParams {
  spaceId: string;
}

// Fetches all admins and moderators of a space (no pagination)
function useFetchSpaceTeam(): (props: FetchSpaceTeamProps) => Promise<SpaceMemberWithUser[]> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceTeam = useCallback(
    async ({ spaceId, spaceReputation, spaceReputationId, spaceReputationDescendants }: FetchSpaceTeamProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const url = `/${projectId}/spaces/${spaceId}/team`;

      const params: Record<string, any> = {
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      };

      const response = await axios.get<{ data: SpaceMemberWithUser[] }>(url, {
        params,
      });

      return response.data.data;
    },
    [projectId, axios]
  );

  return fetchSpaceTeam;
}

export default useFetchSpaceTeam;

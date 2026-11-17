import { useCallback } from "react";
import useProject from "../projects/useProject";
import {
  SpaceMembersResponse,
  SpaceMemberRole,
  SpaceMemberStatus,
} from "../../interfaces/models/SpaceMember";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../utils/spaceReputationParams";

export interface FetchSpaceMembersProps extends SpaceReputationContextParams {
  spaceId: string;
  page?: number;
  limit?: number;
  role?: SpaceMemberRole;
  status?: SpaceMemberStatus;
}

function useFetchSpaceMembers(): (props: FetchSpaceMembersProps) => Promise<SpaceMembersResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchSpaceMembers = useCallback(
    async ({ spaceId, page, limit, role, status, spaceReputation }: FetchSpaceMembersProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!spaceId) {
        throw new Error("Please pass a spaceId");
      }

      const params: Record<string, any> = {
        page,
        limit,
        role,
        status,
        ...buildSpaceReputationParams({ spaceReputation }),
      };

      const response = await axios.get<SpaceMembersResponse>(
        `/${projectId}/spaces/${spaceId}/members`,
        { params }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchSpaceMembers;
}

export default useFetchSpaceMembers;

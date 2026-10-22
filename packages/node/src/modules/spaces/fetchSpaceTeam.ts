import { SublayHttpClient } from "../../core/client";
import { SpaceTeamResponse } from "../../interfaces/SpaceMember";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchSpaceTeamProps extends SpaceReputationContextParams {
  spaceId: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (members-only reading). Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchSpaceTeam(
  client: SublayHttpClient,
  data: FetchSpaceTeamProps
): Promise<SpaceTeamResponse> {
  const {
    spaceId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const response = await client.projectInstance.get<SpaceTeamResponse>(
    `/spaces/${spaceId}/team`,
    {
      params: {
        ...rest,
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  return response.data;
}

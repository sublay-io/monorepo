import { SublayHttpClient } from "../../core/client";
import { AcceptedConnectionRow } from "../../interfaces/Connection";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchConnectionsProps
  extends SpaceReputationUserParams,
    UserSearchParams {
  page?: number;
  limit?: number;
}

/**
 * GET /connections — the caller's accepted connections; each row's `user` is
 * the other user.
 */
export async function fetchConnections(
  client: SublayHttpClient,
  data: FetchConnectionsProps
): Promise<PaginatedResponse<AcceptedConnectionRow>> {
  const {
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const params = {
    ...rest,
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<
    PaginatedResponse<AcceptedConnectionRow>
  >("/connections", { params });
  return response.data;
}

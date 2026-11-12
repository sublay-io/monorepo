import { SublayHttpClient } from "../../core/client";
import { AcceptedConnectionRow } from "../../interfaces/Connection";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchConnectionsByUserIdProps
  extends SpaceReputationUserParams,
    UserSearchParams {
  userId: string;
  page?: number;
  limit?: number;
}

/**
 * GET /users/:userId/connections — `:userId`'s accepted connections, each
 * seen from their side (`user` = their counterpart). The same shape whoever
 * reads it.
 */
export async function fetchConnectionsByUserId(
  client: SublayHttpClient,
  data: FetchConnectionsByUserIdProps
): Promise<PaginatedResponse<AcceptedConnectionRow>> {
  const {
    userId,
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
  >(`/users/${userId}/connections`, { params });
  return response.data;
}

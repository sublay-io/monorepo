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
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
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
  const response = await client.projectInstance.get<
    PaginatedResponse<AcceptedConnectionRow>
  >(`/users/${userId}/connections`, {
    params: {
      ...rest,
      ...buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      }),
    },
  });
  return response.data;
}

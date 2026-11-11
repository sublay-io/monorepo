import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchFollowingByUserIdProps
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

/** Each row is a follow whose `user` is the followed user. */
export async function fetchFollowingByUserId(
  client: SublayHttpClient,
  data: FetchFollowingByUserIdProps
): Promise<PaginatedResponse<FollowRow>> {
  const {
    userId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const response = await client.projectInstance.get<PaginatedResponse<FollowRow>>(
    `/users/${userId}/following`,
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

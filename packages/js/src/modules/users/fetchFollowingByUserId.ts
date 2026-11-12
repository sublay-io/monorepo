import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchFollowingByUserIdProps
  extends SpaceReputationUserParams,
    UserSearchParams {
  userId: string;
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
  const params = {
    ...rest,
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<
    PaginatedResponse<FollowRow>
  >(`/users/${userId}/following`, { params });
  return response.data;
}

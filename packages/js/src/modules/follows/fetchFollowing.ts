import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationUserParams } from "../../interfaces/SpaceReputation";
import { UserSearchParams } from "../../interfaces/UserSearch";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchFollowingProps
  extends SpaceReputationUserParams,
    UserSearchParams {
  page?: number;
  limit?: number;
}

/** Each row is a follow whose `user` is the followed user. */
export async function fetchFollowing(
  client: SublayHttpClient,
  data: FetchFollowingProps
): Promise<PaginatedResponse<FollowRow>> {
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
    PaginatedResponse<FollowRow>
  >("/follows/following", { params });
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { UserSearchParams } from "../../interfaces/UserSearch";

export interface FetchFollowersProps extends UserSearchParams {
  actingUserId: string;
  page?: number;
  limit?: number;
}

/** Each row is a follow whose `user` is the follower. */
export async function fetchFollowers(
  client: SublayHttpClient,
  data: FetchFollowersProps
): Promise<PaginatedResponse<FollowRow>> {
  const response = await client.projectInstance.get<PaginatedResponse<FollowRow>>(
    "/follows/followers",
    { params: data }
  );
  return response.data;
}

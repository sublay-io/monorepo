import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { UserSearchParams } from "../../interfaces/UserSearch";

export interface FetchFollowingProps extends UserSearchParams {
  actingUserId: string;
  page?: number;
  limit?: number;
}

/** Each row is a follow whose `user` is the followed user. */
export async function fetchFollowing(
  client: SublayHttpClient,
  data: FetchFollowingProps
): Promise<PaginatedResponse<FollowRow>> {
  const response = await client.projectInstance.get<PaginatedResponse<FollowRow>>(
    "/follows/following",
    { params: data }
  );
  return response.data;
}

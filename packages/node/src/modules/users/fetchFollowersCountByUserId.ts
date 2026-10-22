import { SublayHttpClient } from "../../core/client";

export interface FetchFollowersCountByUserIdProps {
  userId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
}

export interface FollowersCountResponse {
  count: number;
}

export async function fetchFollowersCountByUserId(
  client: SublayHttpClient,
  data: FetchFollowersCountByUserIdProps
): Promise<FollowersCountResponse> {
  const { userId, ...params } = data;
  const response = await client.projectInstance.get<FollowersCountResponse>(
    `/users/${userId}/followers-count`,
    { params }
  );
  return response.data;
}

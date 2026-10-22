import { SublayHttpClient } from "../../core/client";

export interface FetchFollowingCountByUserIdProps {
  userId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get, with their block rules applied. Omit it for
   * the anonymous view.
   */
  actingUserId?: string;
}

export interface FollowingCountResponse {
  count: number;
}

export async function fetchFollowingCountByUserId(
  client: SublayHttpClient,
  data: FetchFollowingCountByUserIdProps
): Promise<FollowingCountResponse> {
  const { userId, ...params } = data;
  const response = await client.projectInstance.get<FollowingCountResponse>(
    `/users/${userId}/following-count`,
    { params }
  );
  return response.data;
}

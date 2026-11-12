import { SublayHttpClient } from "../../core/client";
import { FollowStatus } from "../../interfaces/Follow";

export interface FetchFollowStatusProps {
  /**
   * The user whose follow relationship is being checked (the target). The
   * status is from the perspective of the token holder.
   */
  userId: string;
}

/**
 * GET /users/:userId/follow — `{ isFollowing }`, plus the follow row (`user` =
 * `:userId`) when the follow exists.
 */
export async function fetchFollowStatus(
  client: SublayHttpClient,
  data: FetchFollowStatusProps
): Promise<FollowStatus> {
  const { userId } = data;
  const response = await client.projectInstance.get<FollowStatus>(
    `/users/${userId}/follow`
  );
  return response.data;
}

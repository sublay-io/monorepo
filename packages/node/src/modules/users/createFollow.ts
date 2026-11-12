import { SublayHttpClient } from "../../core/client";
import { FollowRow } from "../../interfaces/Follow";

export interface CreateFollowProps {
  /** The user being followed (the target). */
  userId: string;
  /** The user performing the follow (the follower). */
  actingUserId: string;
}

/**
 * POST /users/:userId/follow — follow `:userId`. Answers 201 with the new
 * follow; its `user` is the followed user.
 */
export async function createFollow(
  client: SublayHttpClient,
  data: CreateFollowProps
): Promise<FollowRow> {
  const { userId, actingUserId } = data;
  const response = await client.projectInstance.post<FollowRow>(
    `/users/${userId}/follow`,
    { actingUserId }
  );
  return response.data;
}

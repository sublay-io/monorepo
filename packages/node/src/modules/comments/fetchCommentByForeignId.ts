import { SublayHttpClient } from "../../core/client";
import { Comment } from "../../interfaces/Comment";

export interface FetchCommentByForeignIdProps {
  foreignId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get (blocks, hidden posts, moderation details).
   * Omit it for the anonymous view.
   */
  actingUserId?: string;
  include?: string;
}

export async function fetchCommentByForeignId(
  client: SublayHttpClient,
  data: FetchCommentByForeignIdProps
): Promise<Comment> {
  const path = `/comments/by-foreign-id`;
  const response = await client.projectInstance.get<Comment>(path, {
    params: data,
  });
  // v8 returns the comment bare (v7 wrapped it in { comment }, which the 7.x
  // SDK unwraps on main).
  return response.data;
}

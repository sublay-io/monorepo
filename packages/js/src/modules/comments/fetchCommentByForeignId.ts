import { SublayHttpClient } from "../../core/client";
import { Comment } from "../../interfaces/Comment";

export interface FetchCommentByForeignIdProps {
  foreignId: string;
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

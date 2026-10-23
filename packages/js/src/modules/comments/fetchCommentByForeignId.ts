import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Comment, CommentIncludeParam } from "../../interfaces/Comment";

export interface FetchCommentByForeignIdProps {
  foreignId: string;
  include?: CommentIncludeParam;
}

export async function fetchCommentByForeignId(
  client: SublayHttpClient,
  data: FetchCommentByForeignIdProps
): Promise<Comment> {
  const path = `/comments/by-foreign-id`;
  const response = await client.projectInstance.get<Comment>(path, {
    params: { ...data, include: serializeInclude(data.include) },
  });
  // v8 returns the comment bare (v7 wrapped it in { comment }, which the 7.x
  // SDK unwraps on main).
  return response.data;
}

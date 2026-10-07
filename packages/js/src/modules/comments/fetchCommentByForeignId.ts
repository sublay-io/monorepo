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
  const response = await client.projectInstance.get<{ comment: Comment }>(path, {
    params: data,
  });
  // The v7 server wraps single-comment reads in { comment } (the only
  // single-record read that does); unwrap so callers get the Comment itself.
  return response.data.comment;
}

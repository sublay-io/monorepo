import { SublayHttpClient } from "../../core/client";

export interface DeleteCommentProps {
  commentId: string;
  /**
   * The user this delete acts as (service key only). Required when the comment
   * has an author: name the author, and the delete runs exactly as their own
   * (a user's delete). Omit it only for an app-owned comment (no author).
   */
  actingUserId?: string;
}

export async function deleteComment(
  client: SublayHttpClient,
  data: DeleteCommentProps
): Promise<void> {
  const { commentId, actingUserId } = data;
  const path = `/comments/${commentId}`;

  const response = await client.projectInstance.delete<void>(path, {
    params: { actingUserId },
  });
  return response.data;
}

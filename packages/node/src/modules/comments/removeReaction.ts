import { SublayHttpClient } from "../../core/client";
import { Comment } from "../../interfaces/Comment";

export interface RemoveCommentReactionProps {
  commentId: string;
  actingUserId: string;
}

export async function removeReaction(
  client: SublayHttpClient,
  data: RemoveCommentReactionProps
): Promise<Comment> {
  const { commentId, actingUserId } = data;
  // The server returns the updated comment, as `actingUserId` sees it.
  const response = await client.projectInstance.delete<Comment>(
    `/comments/${commentId}/reactions`,
    { data: { actingUserId } }
  );
  return response.data;
}

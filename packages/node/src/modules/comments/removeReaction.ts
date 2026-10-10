import { SublayHttpClient } from "../../core/client";
import { Comment } from "../../interfaces/Comment";

export interface RemoveCommentReactionProps {
  commentId: string;
  userId: string;
}

export async function removeReaction(
  client: SublayHttpClient,
  data: RemoveCommentReactionProps
): Promise<Comment> {
  const { commentId, userId } = data;
  // The server returns the updated comment, as `userId` sees it.
  const response = await client.projectInstance.delete<Comment>(
    `/comments/${commentId}/reactions`,
    { data: { userId } }
  );
  return response.data;
}

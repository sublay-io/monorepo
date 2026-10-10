import { SublayHttpClient } from "../../core/client";
import { ReactionType } from "../../interfaces/Reaction";
import { Comment } from "../../interfaces/Comment";

export interface AddCommentReactionProps {
  commentId: string;
  reactionType: ReactionType;
  userId: string;
}

export async function addReaction(
  client: SublayHttpClient,
  data: AddCommentReactionProps
): Promise<Comment> {
  const { commentId, reactionType, userId } = data;
  // The server returns the updated comment, as `userId` sees it.
  const response = await client.projectInstance.post<Comment>(
    `/comments/${commentId}/reactions`,
    { reactionType, userId }
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { ReactionType } from "../../interfaces/Reaction";
import { Comment } from "../../interfaces/Comment";

export interface AddCommentReactionProps {
  commentId: string;
  reactionType: ReactionType;
  actingUserId: string;
}

export async function addReaction(
  client: SublayHttpClient,
  data: AddCommentReactionProps
): Promise<Comment> {
  const { commentId, reactionType, actingUserId } = data;
  // The server returns the updated comment, as `actingUserId` sees it.
  const response = await client.projectInstance.post<Comment>(
    `/comments/${commentId}/reactions`,
    { reactionType, actingUserId }
  );
  return response.data;
}

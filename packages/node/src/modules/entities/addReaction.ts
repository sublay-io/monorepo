import { SublayHttpClient } from "../../core/client";
import { ReactionType } from "../../interfaces/Reaction";
import { Entity } from "../../interfaces/Entity";

export interface AddEntityReactionProps {
  entityId: string;
  reactionType: ReactionType;
  userId: string;
}

export async function addReaction(
  client: SublayHttpClient,
  data: AddEntityReactionProps
): Promise<Entity> {
  const { entityId, reactionType, userId } = data;
  // The server returns the updated entity, as `userId` sees it.
  const response = await client.projectInstance.post<Entity>(
    `/entities/${entityId}/reactions`,
    { reactionType, userId }
  );
  return response.data;
}

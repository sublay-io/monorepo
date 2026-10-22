import { SublayHttpClient } from "../../core/client";
import { ReactionType } from "../../interfaces/Reaction";
import { Entity } from "../../interfaces/Entity";

export interface AddEntityReactionProps {
  entityId: string;
  reactionType: ReactionType;
  actingUserId: string;
}

export async function addReaction(
  client: SublayHttpClient,
  data: AddEntityReactionProps
): Promise<Entity> {
  const { entityId, reactionType, actingUserId } = data;
  // The server returns the updated entity, as `actingUserId` sees it.
  const response = await client.projectInstance.post<Entity>(
    `/entities/${entityId}/reactions`,
    { reactionType, actingUserId }
  );
  return response.data;
}

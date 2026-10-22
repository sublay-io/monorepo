import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface RemoveEntityReactionProps {
  entityId: string;
  actingUserId: string;
}

export async function removeReaction(
  client: SublayHttpClient,
  data: RemoveEntityReactionProps
): Promise<Entity> {
  const { entityId, actingUserId } = data;
  // The server returns the updated entity, as `actingUserId` sees it.
  const response = await client.projectInstance.delete<Entity>(
    `/entities/${entityId}/reactions`,
    { data: { actingUserId } }
  );
  return response.data;
}

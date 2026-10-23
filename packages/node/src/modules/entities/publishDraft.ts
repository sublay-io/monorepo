import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface PublishDraftProps {
  entityId: string;
  /**
   * The user this publish acts as (service key only): the draft's author, and
   * the request runs exactly as their own access token's. A draft with no
   * author, which this API never creates, is answered as not found (404).
   */
  actingUserId?: string;
}

export async function publishDraft(
  client: SublayHttpClient,
  data: PublishDraftProps
): Promise<Entity> {
  const { entityId, actingUserId } = data;
  const response = await client.projectInstance.patch<Entity>(
    `/entities/${entityId}/publish`,
    { actingUserId }
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface PublishDraftProps {
  entityId: string;
  /**
   * The user this publish acts as (service key only). Required when the draft
   * has an author: name the author, and the request runs exactly as their own
   * access token's. Omit it only for an app-owned draft (no author).
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

import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface PublishDraftProps {
  entityId: string;
  /**
   * The user this publish acts as (service key only). Required when the draft
   * has an author: name the author, and the request runs exactly as their own
   * access token's. A draft created through this API always has an author;
   * omit it only for a draft with none, which only an earlier API version
   * could create.
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

import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";

export interface PublishDraftProps {
  entityId: string;
  /**
   * The user this publish acts as: the draft's author, and the request runs
   * exactly as their own access token's. Required: a draft always has an
   * author (one without is answered as not found, 404), and a service key
   * that names nobody gets 400 `entity/missing-user-id`.
   */
  actingUserId: string;
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

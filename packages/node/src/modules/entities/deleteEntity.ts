import { SublayHttpClient } from "../../core/client";

export interface DeleteEntityProps {
  entityId: string;
  /**
   * The user this delete acts as (service key only). Required when the entity
   * has an author: name the author, and the request runs exactly as their own
   * access token's. Omit it only for an app-owned entity (no author).
   */
  actingUserId?: string;
}

export async function deleteEntity(
  client: SublayHttpClient,
  data: DeleteEntityProps
): Promise<void> {
  const { entityId, actingUserId } = data;
  const path = `/entities/${entityId}`;
  const response = await client.projectInstance.delete<void>(path, {
    params: { actingUserId },
  });
  return response.data;
}

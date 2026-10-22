import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";

export interface UpdateEntityProps {
  entityId: string;
  title?: string;
  content?: string;
  attachments?: Record<string, any>[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * The user this edit acts as (service key only). Required when the entity
   * has an author: name the author, and the request runs exactly as their own
   * access token's. Omit it only for an app-owned entity (no author).
   */
  actingUserId?: string;
}

export async function updateEntity(
  client: SublayHttpClient,
  data: UpdateEntityProps
): Promise<Entity> {
  const { entityId, ...restOfProps } = data;
  const path = `/entities/${entityId}`;
  const response = await client.projectInstance.patch<Entity>(
    path,
    restOfProps
  );
  return response.data;
}

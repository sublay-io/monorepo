import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";

export interface CreateEntityProps {
  foreignId?: string;
  sourceId?: string;
  spaceId?: string;
  title?: string;
  content?: string;
  attachments?: any[];
  keywords?: string[];
  mentions?: Mention[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /** The user the service key acts as, who authors the entity. Omit for an app-owned entity. */
  actingUserId?: string;
  isDraft?: boolean;
  excludeUserId?: boolean;
  requireUser?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

export async function createEntity(
  client: SublayHttpClient,
  data: CreateEntityProps
): Promise<Entity> {
  const path = `/entities`;
  const response = await client.projectInstance.post<Entity>(path, data);
  return response.data;
}

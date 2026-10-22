import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";

export interface CreateEntityProps {
  foreignId?: string;
  sourceId?: string;
  spaceId?: string;
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
  isDraft?: boolean;
}

export async function createEntity(
  client: SublayHttpClient,
  data: CreateEntityProps
): Promise<Entity> {
  const path = `/entities`;
  const response = await client.projectInstance.post<Entity>(path, data);
  return response.data;
}

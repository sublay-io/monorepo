import { SublayHttpClient } from "../../core/client";
import { Entity } from "../../interfaces/Entity";
import { Mention } from "../../interfaces/Mention";

export interface CreateEntityProps {
  foreignId?: string;
  /**
   * Where the entity comes from (free text, e.g. `"blog"`). `"none"`,
   * `"null"` and `"undefined"` are reserved and refused. For no source, leave
   * it out or pass `null`.
   */
  sourceId?: string | null;
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

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
  /**
   * The user the service key acts as, who authors the entity; the create runs
   * under that user's own checks. Omit it for an app-owned entity (no author).
   */
  actingUserId?: string;
  /** Save as a draft. A draft needs an owner, so this requires `actingUserId`. */
  isDraft?: boolean;
  /** Refuse to create the entity without an author (`actingUserId`). */
  requireUser?: boolean;
  /** Backdate the entity (service key only, also with `actingUserId`). */
  createdAt?: Date;
  /** Backdate the entity's last update (service key only, also with `actingUserId`). */
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

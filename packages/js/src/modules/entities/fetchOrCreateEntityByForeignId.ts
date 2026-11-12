import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Entity,
  TopCommentsParams,
  EntityIncludeParam,
} from "../../interfaces/Entity";

export interface FetchOrCreateEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  include?: EntityIncludeParam;
}

export interface FetchOrCreateEntityByForeignIdResult {
  entity: Entity;
  /** `true` when this call created the entity (HTTP 201), `false` when it existed (200). */
  created: boolean;
}

/**
 * GET /entities/by-foreign-id?createIfNotFound=true — return the entity with
 * this foreign id, or create an app-owned one carrying only the foreign id
 * when there is none. Whether a user may create it is the project's
 * `entityCreation.authorless` setting.
 *
 * Resolves to `{ entity, created }`: `created` is true when the server
 * answered 201.
 */
export async function fetchOrCreateEntityByForeignId(
  client: SublayHttpClient,
  data: FetchOrCreateEntityByForeignIdProps
): Promise<FetchOrCreateEntityByForeignIdResult> {
  const response = await client.projectInstance.get<Entity>(
    "/entities/by-foreign-id",
    {
      params: {
        ...data,
        include: serializeInclude(data.include),
        createIfNotFound: true,
      },
    }
  );

  // 201 is an entity this call created; 200 is an existing one (also the
  // loser of a concurrent create).
  return { entity: response.data, created: response.status === 201 };
}

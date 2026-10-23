import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Entity,
  TopCommentsParams,
  EntityIncludeParam,
} from "../../interfaces/Entity";

export interface FetchEntityByForeignIdProps extends TopCommentsParams {
  foreignId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get (drafts, blocks, saved flags, own reaction,
   * top comments), and the read counts as their view. Omit it for the
   * anonymous view. It shapes the read only: an entity made by
   * `createIfNotFound` is always app-owned.
   */
  actingUserId?: string;
  createIfNotFound?: boolean;
  include?: EntityIncludeParam;
}

export async function fetchEntityByForeignId(
  client: SublayHttpClient,
  data: FetchEntityByForeignIdProps
): Promise<Entity> {
  const path = `/entities/by-foreign-id`;
  const response = await client.projectInstance.get<Entity>(path, {
    params: { ...data, include: serializeInclude(data.include) },
  });
  return response.data;
}

import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Entity,
  TopCommentsParams,
  EntityIncludeParam,
} from "../../interfaces/Entity";

export interface FetchEntityByShortIdProps extends TopCommentsParams {
  shortId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get (drafts, blocks, saved flags, own reaction,
   * top comments), and the read counts as their view. Omit it for the
   * anonymous view.
   */
  actingUserId?: string;
  include?: EntityIncludeParam;
}

export async function fetchEntityByShortId(
  client: SublayHttpClient,
  data: FetchEntityByShortIdProps
): Promise<Entity> {
  const path = `/entities/by-short-id`;
  const response = await client.projectInstance.get<Entity>(path, {
    params: { ...data, include: serializeInclude(data.include) },
  });
  return response.data;
}

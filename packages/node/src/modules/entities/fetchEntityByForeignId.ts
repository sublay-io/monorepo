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
   * anonymous view.
   */
  actingUserId?: string;
  include?: EntityIncludeParam;
}

/**
 * GET /entities/by-foreign-id — a pure read: a miss is a 404. To create the
 * entity when it is missing, use
 * {@link import("./fetchOrCreateEntityByForeignId").fetchOrCreateEntityByForeignId}.
 */
export async function fetchEntityByForeignId(
  client: SublayHttpClient,
  data: FetchEntityByForeignIdProps
): Promise<Entity> {
  const path = `/entities/by-foreign-id`;
  // Params are listed explicitly (not spread from `data`) so an untyped extra
  // such as `createIfNotFound` never reaches the server and turns this read
  // into a create.
  const params: Record<string, any> = {
    foreignId: data.foreignId,
    actingUserId: data.actingUserId,
    include: serializeInclude(data.include),
    topCommentsLimit: data.topCommentsLimit,
    topCommentsSortByReaction: data.topCommentsSortByReaction,
  };
  const response = await client.projectInstance.get<Entity>(path, { params });
  return response.data;
}

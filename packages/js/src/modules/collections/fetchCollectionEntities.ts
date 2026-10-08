import { SublayHttpClient } from "../../core/client";
import {
  CollectionEntityIncludeParam,
  Entity,
  TopCommentsParams,
} from "../../interfaces/Entity";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchCollectionEntitiesProps extends TopCommentsParams {
  collectionId: string;
  page?: number;
  limit?: number;
  sortBy?: "new" | "added" | "top" | "hot";
  /** Which reaction `top` ranks by (server default: "upvote"). Only valid with `sortBy: "top"` — the server rejects it otherwise. */
  sortByReaction?:
    | "upvote"
    | "downvote"
    | "like"
    | "love"
    | "wow"
    | "sad"
    | "angry"
    | "funny";
  sortDir?: "asc" | "desc";
  /** Associations to populate (no "saved": every item in a collection is saved). */
  include?: CollectionEntityIncludeParam;
}

export async function fetchCollectionEntities(
  client: SublayHttpClient,
  data: FetchCollectionEntitiesProps
): Promise<PaginatedResponse<Entity>> {
  const { collectionId, include, ...rest } = data;
  const params = {
    ...rest,
    ...(include !== undefined
      ? { include: Array.isArray(include) ? include.join(",") : include }
      : {}),
  };
  const response = await client.projectInstance.get<PaginatedResponse<Entity>>(
    `/collections/${collectionId}/entities`,
    { params }
  );
  return response.data;
}

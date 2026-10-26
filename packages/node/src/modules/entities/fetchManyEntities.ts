import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import type { WithOneWaySortDir } from "../../interfaces/OneWaySortParams";
import {
  Entity,
  TopCommentsParams,
  EntityIncludeParam,
} from "../../interfaces/Entity";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface KeywordsFilters {
  includes?: string[];
  doesNotInclude?: string[];
}

export interface MetadataFilters {
  includes?: { [key: string]: any };
  includesAny?: { [key: string]: any }[];
  doesNotInclude?: { [key: string]: any };
  exists?: string[];
  doesNotExist?: string[];
}

export interface TextFilters {
  hasTitle?: "true" | "false";
  includes?: string | string[];
  doesNotInclude?: string | string[];
}

export interface AttachmentsFilters {
  hasAttachments?: "true" | "false";
}

export interface LocationFilters {
  latitude: string;
  longitude: string;
  radius: string;
}

export interface FetchManyEntitiesBaseProps
  extends SpaceReputationContextParams,
    TopCommentsParams {
  /** Only entities from this source, or `"none"` for entities with no source. Left out: any source. */
  sourceId?: string | "none";
  /** Only entities in this space, or `"none"` for entities in no space. Left out: any space, or none. */
  spaceId?: string | "none";

  // Sorting & Pagination
  // `metadata.<prop>` sorts by a metadata field.
  sortBy?:
    | "createdAt"
    | "hot"
    | "top"
    | "controversial"
    | `metadata.${string}`;
  sortDir?: "asc" | "desc";
  sortType?: "auto" | "numeric" | "text" | "boolean" | "timestamp";
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
  page?: number;
  limit?: number;

  // Optional associations to expand
  include?: EntityIncludeParam;

  // Time-based filtering
  timeFrame?: "hour" | "day" | "week" | "month" | "year";

  /** Author filter: only entities whose `userId` is this user. Not the viewer. */
  userId?: string;
  /**
   * List as this user (service key only): the page is exactly what their own
   * access token would get (followed-only, blocks, their own drafts, saved
   * flags, own reactions, top comments), and the reads count as their views.
   * Omit it for the anonymous view.
   */
  actingUserId?: string;
  /** Only entities by users the viewer follows. Needs a viewer (`actingUserId`). */
  followedOnly?: "true" | "false";

  // Keyword filters
  keywordsFilters?: KeywordsFilters;

  // Metadata filters
  metadataFilters?: MetadataFilters;

  // Title filtering
  titleFilters?: TextFilters;

  // Content filtering
  contentFilters?: {
    hasContent?: "true" | "false";
    includes?: string | string[];
    doesNotInclude?: string | string[];
  };

  // Attachments filtering
  attachmentsFilters?: AttachmentsFilters;

  // Location filtering
  locationFilters?: LocationFilters;

  // NSFW filtering (keyed off effective NSFW)
  nsfwFilter?: "include-all" | "exclude" | "only";

  // Block filtering: entities authored by users the viewer is block-edged with
  // are hidden by default ("exclude"). "include-outbound-blocked" re-includes
  // ONLY the viewer's own outbound-blocked authors (their "view anyway" choice);
  // it never surfaces content from users who blocked the viewer.
  blockedFilter?: "exclude" | "include-outbound-blocked";
}

/** `sortDir` is not accepted with `sortBy: "hot"` or `"controversial"`. */
export type FetchManyEntitiesProps = WithOneWaySortDir<FetchManyEntitiesBaseProps>;

export async function fetchManyEntities(
  client: SublayHttpClient,
  data: FetchManyEntitiesProps
): Promise<PaginatedResponse<Entity>> {
  const path = `/entities`;
  const { spaceReputation, spaceReputationId, spaceReputationDescendants, ...rest } =
    data;
  const response = await client.projectInstance.get<PaginatedResponse<Entity>>(
    path,
    {
      params: {
        ...rest,
        include: serializeInclude(rest.include),
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  return response.data;
}

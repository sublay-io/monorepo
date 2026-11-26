import useProject from "../projects/useProject";
import { useState } from "react";
import { oneWaySortFields } from "../../helpers/oneWaySorts";
import { EntityListSortByOptions, SortByReaction, SortDirection, SortType } from "../../interfaces/EntityListSortByOptions";
import {
  Entity,
  EntityInclude,
  EntityIncludeParam,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import { TimeFrame } from "../../interfaces/TimeFrame";
import { KeywordsFilters } from "../../interfaces/entity-filters/KeywordsFilters";
import { TitleFilters } from "../../interfaces/entity-filters/TitleFilters";
import { ContentFilters } from "../../interfaces/entity-filters/ContentFilters";
import { AttachmentsFilters } from "../../interfaces/entity-filters/AttachmentsFilters";
import { LocationFilters } from "../../interfaces/entity-filters/LocationFilters";
import { MetadataFilters } from "../../interfaces/entity-filters/MetadataFilters";
import { NsfwFilter } from "../../interfaces/NsfwFilter";
import { BlockedFilter } from "../../interfaces/BlockedFilter";
import useFetchManyEntities from "./useFetchManyEntities";
import { useListEngine } from "../list/useListEngine";
import { pageNumberPaging } from "../list/paging";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";

export interface UseFetchManyEntitiesWrapperProps
  extends SpaceReputationContextParams,
    TopCommentsParams {
  userId?: string | null;
  limit?: number;
  /** Only entities from this source, or `"none"` for entities with no source. `null` or left out: any source. */
  sourceId?: string | "none" | null;
  /** Only entities in this space, or `"none"` for entities in no space. `null` or left out: any space, or none. */
  spaceId?: string | "none" | null;
  followedOnly?: boolean;
  include?: EntityIncludeParam;
  defaultSortBy?: EntityListSortByOptions;
  defaultSortByReaction?: SortByReaction;
  defaultSortDir?: SortDirection;
  defaultSortType?: SortType;
  timeFrame?: TimeFrame | null;
  keywordsFilters?: KeywordsFilters | null;
  titleFilters?: TitleFilters | null;
  contentFilters?: ContentFilters | null;
  attachmentsFilters?: AttachmentsFilters | null;
  locationFilters?: LocationFilters | null;
  metadataFilters?: MetadataFilters | null;
  nsfwFilter?: NsfwFilter | null;
  blockedFilter?: BlockedFilter | null;
}

export interface UseFetchManyEntitiesWrapperValues {
  entities: Entity[];
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  sortBy: EntityListSortByOptions;
  sortByReaction: SortByReaction;
  sortDir: SortDirection;
  sortType: SortType;
  setSortBy: (newSortBy: EntityListSortByOptions) => void;
  setSortByReaction: (newSortByReaction: SortByReaction) => void;
  setSortDir: (newSortDir: SortDirection) => void;
  setSortType: (newSortType: SortType) => void;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while loading or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload from page 1 with the current filters and sort. Never rejects. */
  refetch: () => Promise<void>;
}

function useFetchManyEntitiesWrapper(
  props: UseFetchManyEntitiesWrapperProps
): UseFetchManyEntitiesWrapperValues {
  const {
    userId,
    limit = 10,
    defaultSortBy = "createdAt",
    defaultSortByReaction = "upvote",
    defaultSortDir = "desc",
    defaultSortType = "auto",
    timeFrame,
    sourceId,
    spaceId,
    include,
    topCommentsLimit,
    topCommentsSortByReaction,
    followedOnly,
    keywordsFilters,
    titleFilters,
    contentFilters,
    attachmentsFilters,
    locationFilters,
    metadataFilters,
    nsfwFilter,
    blockedFilter,
    spaceReputation,
  } = props;

  const reputation = { spaceReputation };

  // `include` is flattened to the string the wire carries. An inline array is
  // a fresh reference every render; only the string goes into the reset key.
  const includeKey = Array.isArray(include) ? include.join(",") : include;

  const fetchManyEntities = useFetchManyEntities();

  const [sortBy, setSortBy] = useState<EntityListSortByOptions>(defaultSortBy);
  const [sortByReaction, setSortByReaction] = useState<SortByReaction>(defaultSortByReaction);
  const [sortDir, setSortDir] = useState<SortDirection>(defaultSortDir);
  const [sortType, setSortType] = useState<SortType>(defaultSortType);

  // A different project is a different list.
  const { projectId } = useProject();

  // The one request builder for every page: a param can't be sent with page 1
  // and left off page 2.
  const buildParams = (page: number) => ({
    userId: userId ?? undefined,
    page,
    ...oneWaySortFields(sortBy, sortDir),
    sortByReaction,
    sortType,
    timeFrame,
    sourceId: sourceId ?? undefined,
    spaceId: spaceId ?? undefined,
    limit,
    include: includeKey ? (includeKey.split(",") as EntityInclude[]) : undefined,
    topCommentsLimit,
    topCommentsSortByReaction,
    followedOnly,
    keywordsFilters: keywordsFilters ?? undefined,
    titleFilters: titleFilters ?? undefined,
    contentFilters: contentFilters ?? undefined,
    attachmentsFilters: attachmentsFilters ?? undefined,
    locationFilters: locationFilters ?? undefined,
    metadataFilters: metadataFilters ?? undefined,
    nsfwFilter,
    blockedFilter,
    ...reputation,
  });

  // Serialized, so an inline filter object or `include` array (a fresh
  // reference every render) doesn't restart the list.
  const resetKey = JSON.stringify([projectId, buildParams(1)]);

  const list = useListEngine<Entity, number>({
    enabled: true,
    resetKey,
    fetchPage: pageNumberPaging((page) => fetchManyEntities(buildParams(page))),
    errorLabel: "Failed to fetch entities:",
  });

  return {
    entities: list.items,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    sortBy,
    sortByReaction,
    sortDir,
    sortType,
    setSortBy,
    setSortByReaction,
    setSortDir,
    setSortType,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useFetchManyEntitiesWrapper;

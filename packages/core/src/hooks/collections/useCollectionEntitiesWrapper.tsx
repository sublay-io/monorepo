import { useViewerKey } from "../list/useViewerKey";
import { useState } from "react";
import {
  CollectionEntityIncludeParam,
  Entity,
  TopCommentsParams,
} from "../../interfaces/models/Entity";
import { SortByReaction } from "../../interfaces/EntityListSortByOptions";
import { useLazyFetchCollectionEntitiesQuery } from "../../store/api/collectionsApi";
import { useListLoader } from "../list/useListLoader";
import { pageNumberPaging } from "../list/paging";
import useProject from "../projects/useProject";
import useCollections from "./useCollections";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import {
  setCollectionEntities,
  appendCollectionEntities,
  selectCollectionEntities,
} from "../../store/slices/collectionsSlice";
import type { SublayError } from "../../errors/SublayError";

export interface UseCollectionEntitiesWrapperProps extends TopCommentsParams {
  collectionId?: string | null; // Optional - defaults to current collection from Redux
  limit?: number;
  /** No `"saved"`: every entity in a collection is saved. */
  include?: CollectionEntityIncludeParam;
  defaultSortBy?: "createdAt" | "addedAt" | "top" | "hot";
  defaultSortByReaction?: SortByReaction;
  defaultSortDir?: "asc" | "desc";
}

export interface UseCollectionEntitiesWrapperValues {
  entities: Entity[];
  loading: boolean;
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: SublayError | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  sortBy: "createdAt" | "addedAt" | "top" | "hot";
  sortByReaction: SortByReaction;
  sortDir: "asc" | "desc";
  setSortBy: (newSortBy: "createdAt" | "addedAt" | "top" | "hot") => void;
  setSortByReaction: (newSortByReaction: SortByReaction) => void;
  setSortDir: (newSortDir: "asc" | "desc") => void;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while loading or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /** Reload from page 1 with the current sort. Never rejects. */
  refetch: () => Promise<void>;
}

function useCollectionEntitiesWrapper(
  props: UseCollectionEntitiesWrapperProps
): UseCollectionEntitiesWrapperValues {
  const {
    collectionId: passedCollectionId,
    limit = 20,
    defaultSortBy = "addedAt",
    defaultSortByReaction = "upvote",
    defaultSortDir = "desc",
    include,
    topCommentsLimit,
    topCommentsSortByReaction,
  } = props;

  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const { currentCollection } = useCollections();
  const [fetchCollectionEntitiesQuery] = useLazyFetchCollectionEntitiesQuery();

  // A different viewer is a different list (an account change empties the
  // collections in the store too).
  const viewerId = useViewerKey();

  const effectiveCollectionId = passedCollectionId ?? currentCollection?.id;

  // Read entities from shared Redux state — written here and by useCollectionsActions for optimistic updates
  const entities = useSublaySelector(selectCollectionEntities(effectiveCollectionId));

  const [sortBy, setSortBy] = useState<"createdAt" | "addedAt" | "top" | "hot">(defaultSortBy);
  // Only sent when sortBy is "top" (see collectionsApi).
  const [sortByReaction, setSortByReaction] = useState<SortByReaction>(defaultSortByReaction);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);

  // The one request builder for every page.
  const buildParams = (page: number) => ({
    projectId: projectId as string,
    collectionId: effectiveCollectionId as string,
    page,
    limit,
    sortBy,
    sortByReaction,
    sortDir,
    include,
    topCommentsLimit,
    topCommentsSortByReaction,
  });

  // The entities live in the shared store (useCollectionsActions writes to
  // them optimistically), so a reset leaves them in place until page 1
  // replaces them.
  const list = useListLoader<Entity, number>({
    enabled: !!projectId && !!effectiveCollectionId,
    // Serialized, so an inline `include` array (a fresh reference every
    // render) doesn't restart the list.
    resetKey: JSON.stringify([viewerId, buildParams(1)]),
    fetchPage: pageNumberPaging((page) =>
      fetchCollectionEntitiesQuery(buildParams(page)).unwrap()
    ),
    onPage: (page, replace) => {
      const collectionId = effectiveCollectionId as string;
      dispatch(
        replace
          ? setCollectionEntities({ collectionId, entities: page.items })
          : appendCollectionEntities({ collectionId, entities: page.items })
      );
    },
    errorLabel: "Failed to fetch collection entities:",
  });

  return {
    entities,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    sortBy,
    sortByReaction,
    sortDir,
    setSortBy,
    setSortByReaction,
    setSortDir,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useCollectionEntitiesWrapper;

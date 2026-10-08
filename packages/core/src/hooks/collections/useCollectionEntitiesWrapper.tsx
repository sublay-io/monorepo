import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Entity, EntityIncludeParam } from "../../interfaces/models/Entity";
import { SortByReaction } from "../../interfaces/EntityListSortByOptions";
import { useLazyFetchCollectionEntitiesQuery } from "../../store/api/collectionsApi";
import { handleError } from "../../utils/handleError";
import useProject from "../projects/useProject";
import useCollections from "./useCollections";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import {
  setCollectionEntities,
  appendCollectionEntities,
  selectCollectionEntities,
} from "../../store/slices/collectionsSlice";

export interface UseCollectionEntitiesWrapperProps {
  collectionId?: string | null; // Optional - defaults to current collection from Redux
  limit?: number;
  include?: EntityIncludeParam;
  defaultSortBy?: "new" | "top" | "hot" | "added";
  defaultSortByReaction?: SortByReaction;
  defaultSortDir?: "asc" | "desc";
}

export interface UseCollectionEntitiesWrapperValues {
  entities: Entity[];
  loading: boolean;
  hasMore: boolean;
  sortBy: "new" | "top" | "hot" | "added";
  sortByReaction: SortByReaction;
  sortDir: "asc" | "desc";
  setSortBy: (newSortBy: "new" | "top" | "hot" | "added") => void;
  setSortByReaction: (newSortByReaction: SortByReaction) => void;
  setSortDir: (newSortDir: "asc" | "desc") => void;
  loadMore: () => void;
  refetch: () => void;
}

function useCollectionEntitiesWrapper(
  props: UseCollectionEntitiesWrapperProps
): UseCollectionEntitiesWrapperValues {
  const {
    collectionId: passedCollectionId,
    limit = 20,
    defaultSortBy = "added",
    defaultSortByReaction = "upvote",
    defaultSortDir = "desc",
    include,
  } = props;

  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const { currentCollection } = useCollections();
  const [fetchCollectionEntitiesQuery] = useLazyFetchCollectionEntitiesQuery();

  const effectiveCollectionId = passedCollectionId ?? currentCollection?.id;

  // Read entities from shared Redux state — written here and by useCollectionsActions for optimistic updates
  const entities = useSublaySelector(selectCollectionEntities(effectiveCollectionId));

  const includeString = useMemo(
    () => (Array.isArray(include) ? include.join(",") : include),
    [include]
  );

  const loading = useRef(false);
  const [loadingState, setLoadingState] = useState(false);

  const hasMore = useRef(true);
  const [hasMoreState, setHasMoreState] = useState(true);

  const [sortBy, setSortBy] = useState<"new" | "top" | "hot" | "added">(defaultSortBy);
  // Only sent when sortBy is "top" (see collectionsApi).
  const [sortByReaction, setSortByReaction] = useState<SortByReaction>(defaultSortByReaction);
  const [sortDir, setSortDir] = useState<"asc" | "desc">(defaultSortDir);
  const [page, setPage] = useState(1);

  const resetEntities = useCallback(async () => {
    if (!projectId || !effectiveCollectionId) {
      return;
    }

    try {
      loading.current = true;
      setLoadingState(true);

      hasMore.current = true;
      setHasMoreState(true);

      setPage(1);

      const response = await fetchCollectionEntitiesQuery({
        projectId,
        collectionId: effectiveCollectionId,
        page: 1,
        limit,
        sortBy,
        sortByReaction,
        sortDir,
        include,
      }).unwrap();

      if (response) {
        const { data: newEntities, pagination } = response;
        dispatch(setCollectionEntities({ collectionId: effectiveCollectionId, entities: newEntities }));
        hasMore.current = pagination.hasMore;
        setHasMoreState(pagination.hasMore);
      }
    } catch (err) {
      handleError(err, "Failed to fetch collection entities:");
    } finally {
      loading.current = false;
      setLoadingState(false);
    }
  }, [
    dispatch,
    fetchCollectionEntitiesQuery,
    projectId,
    effectiveCollectionId,
    limit,
    sortBy,
    sortByReaction,
    sortDir,
    includeString,
  ]);

  const loadMore = useCallback(() => {
    if (loading.current || !hasMore.current) return;
    setPage((prevPage) => prevPage + 1);
  }, []);

  useEffect(() => {
    resetEntities();
  }, [resetEntities]);

  useEffect(() => {
    const loadMoreEntities = async () => {
      if (!projectId || !effectiveCollectionId) {
        return;
      }

      loading.current = true;
      setLoadingState(true);

      try {
        const response = await fetchCollectionEntitiesQuery({
          projectId,
          collectionId: effectiveCollectionId,
          page,
          limit,
          sortBy,
          sortByReaction,
          sortDir,
          include,
        }).unwrap();

        if (response) {
          const { data: newEntities, pagination } = response;
          dispatch(appendCollectionEntities({ collectionId: effectiveCollectionId, entities: newEntities }));
          hasMore.current = pagination.hasMore;
          setHasMoreState(pagination.hasMore);
        }
      } catch (err) {
        handleError(err, "Loading more collection entities failed:");
      } finally {
        loading.current = false;
        setLoadingState(false);
      }
    };

    if (page > 1 && hasMore.current && !loading.current) {
      loadMoreEntities();
    }
  }, [
    page,
    dispatch,
    fetchCollectionEntitiesQuery,
    projectId,
    effectiveCollectionId,
    limit,
    sortBy,
    sortByReaction,
    sortDir,
    includeString,
  ]);

  return {
    entities,
    loading: loadingState,
    hasMore: hasMoreState,
    sortBy,
    sortByReaction,
    sortDir,
    setSortBy,
    setSortByReaction,
    setSortDir,
    loadMore,
    refetch: resetEntities,
  };
}

export default useCollectionEntitiesWrapper;

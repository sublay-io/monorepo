import { useCallback, useMemo, useRef } from "react";
import { useStore } from "react-redux";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import type { SublayState } from "../../store/sublayReducers";
import {
  runSharedListLoad,
  sharedLoadMore,
  useSharedListStatus,
} from "../list/sharedListStatus";

import {
  initializeList,
  updateFiltersAndSortConfig,
  setEntityListLoading,
  setEntityListEntities,
  setEntityListPage,
  selectEntityList,
  selectEntityListEntities,
  selectEntityListLoading,
  selectEntityListHasMore,
  selectEntityListFilters,
  selectEntityListSort,
  selectEntityListConfig,
  type EntityListFilters,
  type EntityListSort,
  type EntityListConfig,
  type EntityListFetchOptions,
} from "../../store/slices/entityListsSlice";

import useInfusedData from "./useInfusedData";
import { useEntityListActionsWithGuard } from "./useEntityListActions";

import { Entity } from "../../interfaces/models/Entity";
import { EntityListSortByOptions, SortByReaction, SortDirection, SortType } from "../../interfaces/EntityListSortByOptions";
import { LocationFilters } from "../../interfaces/entity-filters/LocationFilters";
import { TimeFrame } from "../../interfaces/TimeFrame";
import { MetadataFilters } from "../../interfaces/entity-filters/MetadataFilters";
import { TitleFilters } from "../../interfaces/entity-filters/TitleFilters";
import { ContentFilters } from "../../interfaces/entity-filters/ContentFilters";
import { AttachmentsFilters } from "../../interfaces/entity-filters/AttachmentsFilters";
import { KeywordsFilters } from "../../interfaces/entity-filters/KeywordsFilters";

import { handleError } from "../../utils/handleError";
import type { SublayError } from "../../errors/SublayError";

/** A list filter value as an entity field: `"none"` and no filter both mean no value. */
const noneToUnset = (value: string | null | undefined): string | undefined =>
  value && value !== "none" ? value : undefined;

export interface UseEntityListProps {
  listId: string;
  infuseData?: (foreignId: string) => Promise<Record<string, any> | null>;
}

/**
 * What `fetchEntities` takes. `filters` merge into the list's current
 * filters; `sort` and `config` are the list's settings; `options` controls
 * this fetch.
 */
export interface EntityListFetchEntitiesProps {
  filters?: Partial<EntityListFilters>;
  sort?: Partial<EntityListSort>;
  config?: EntityListConfig;
  options?: EntityListFetchOptions;
}

export interface EntityListCreateEntityProps {
  foreignId?: string;
  title?: string;
  content?: string;
  attachments?: Record<string, any>[];
  keywords?: string[];
  location?: {
    latitude: number;
    longitude: number;
  };
  metadata?: Record<string, any>;
  insertPosition?: "first" | "last";
}

export interface EntityListDeleteEntityProps {
  entityId: string;
}

export interface UseEntityListValues {
  entities: Entity[];
  // setEntities: React.Dispatch<React.SetStateAction<Entity[]>>;
  infusedEntities: (Entity & Record<string, any>)[];

  loading: boolean;
  /**
   * The last load failure, shared by every hook on this `listId`. Cleared
   * when the next load starts; `loadMore()` retries it.
   */
  error: SublayError | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;

  // Individual sort properties (flat access for convenience)
  sortBy: EntityListSortByOptions | null;
  sortByReaction: SortByReaction | null;
  sortDir: SortDirection | null;
  sortType: SortType | null;

  // Filter properties
  timeFrame: TimeFrame | null;
  /**
   * The source filter in use: a source id, `"none"` (entities with no
   * source), or `null` when no source filter is set (every entity).
   */
  sourceId: string | "none" | null;
  userId: string | null;
  followedOnly: boolean;
  keywordsFilters: KeywordsFilters | null;
  titleFilters: TitleFilters | null;
  contentFilters: ContentFilters | null;
  attachmentsFilters: AttachmentsFilters | null;
  locationFilters: LocationFilters | null;
  metadataFilters: MetadataFilters | null;

  fetchEntities: (props?: EntityListFetchEntitiesProps) => void;

  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page of this list is loading, while a
   * filter change is waiting to be fetched, or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload page 1 with the list's current filters, sort and config. The
   * entities stay until the new page replaces them. Never rejects.
   */
  refetch: () => Promise<void>;
  /** JSON only: to create an entity with images or files, use `useCreateEntity`. */
  createEntity: (props: EntityListCreateEntityProps) => Promise<Entity | undefined>;
  deleteEntity: (props: EntityListDeleteEntityProps) => Promise<void>;
}

function useEntityList({
  listId,
  infuseData,
}: UseEntityListProps): UseEntityListValues {
  const dispatch = useSublayDispatch();

  // Get state from Redux (parameterized selectors)
  const entityList = useSublaySelector((state) =>
    selectEntityList(state, listId)
  );
  const entities = useSublaySelector((state) =>
    selectEntityListEntities(state, listId)
  );
  const loading = useSublaySelector((state) =>
    selectEntityListLoading(state, listId)
  );
  const hasMore = useSublaySelector((state) =>
    selectEntityListHasMore(state, listId)
  );
  const filters = useSublaySelector((state) =>
    selectEntityListFilters(state, listId)
  );
  const sort = useSublaySelector((state) =>
    selectEntityListSort(state, listId)
  );
  const config = useSublaySelector((state) =>
    selectEntityListConfig(state, listId)
  );

  // Get entity actions hook
  const entityActions = useEntityListActionsWithGuard();

  // Infused data
  const infusedEntities = useInfusedData({ entities, infuseData });

  // Load bookkeeping shared by every hook showing this list.
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus(`entityList:${listId}`);
  const getList = useCallback(
    () => selectEntityList(store.getState(), listId),
    [store, listId]
  );

  // Debounce timer for filter changes
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page 1 (`first`) or the page after the last one loaded, with the
  // filters, sort and config stored for the list — the one request builder,
  // so every page carries the same params.
  const loadPage = useCallback(
    (first: boolean) =>
      runSharedListLoad(
        status,
        // useEntityListActions logs the failure.
        { first, errorLabel: null },
        async (isCurrent) => {
          const list = getList();
          if (!list || !list.sortBy) return;
          const page = first ? 1 : list.page + 1;
          dispatch(setEntityListLoading({ listId, loading: true }));
          const data = await entityActions.fetchEntities(
            {
              listId,
              page,
              sortBy: list.sortBy,
              sortByReaction: list.sortByReaction,
              sortDir: list.sortDir,
              sortType: list.sortType,
              timeFrame: list.timeFrame,
              userId: list.userId,
              followedOnly: list.followedOnly,
              locationFilters: list.locationFilters,
              keywordsFilters: list.keywordsFilters,
              metadataFilters: list.metadataFilters,
              titleFilters: list.titleFilters,
              contentFilters: list.contentFilters,
              attachmentsFilters: list.attachmentsFilters,
              nsfwFilter: list.nsfwFilter,
              limit: list.limit,
              sourceId: list.sourceId,
              spaceId: list.spaceId,
              include: list.include,
              topCommentsLimit: list.topCommentsLimit,
              topCommentsSortByReaction: list.topCommentsSortByReaction,
              // Flattened downstream by useEntityListActions before reaching
              // the serializer.
              spaceReputation: list.spaceReputation,
            },
            isCurrent
          );
          if (isCurrent() && data) {
            dispatch(setEntityListPage({ listId, page }));
          }
        }
      ),
    [status, getList, dispatch, listId, entityActions.fetchEntities]
  );

  // Fetch entities function (always triggers a fetch)
  const handleFetchEntities = useCallback(
    ({
      filters: newFilters = {},
      sort: newSort,
      config: newConfig,
      options,
    }: EntityListFetchEntitiesProps = {}) => {
      // Apply config defaults if not provided
      // Each call sets the whole config: a field left out goes back to its
      // default rather than being carried over from the last fetch (loadMore
      // reads the stored config).
      const configWithDefaults = {
        sourceId: null,
        spaceId: null,
        limit: 10,
        include: null,
        topCommentsLimit: null,
        topCommentsSortByReaction: null,
        spaceReputation: null,
        ...newConfig,
      };

      // A new query: whatever is loading belongs to the old one, and no page
      // loads until this one's first page has been requested.
      status.invalidate();
      status.pendingReset = true;

      // Ensure Redux state is initialized and update filters/sort/config
      dispatch(initializeList({ listId }));
      dispatch(updateFiltersAndSortConfig({
        listId,
        filters: newFilters,
        sort: newSort,
        config: configWithDefaults,
        options
      }));

      // Clear entities immediately if requested
      if (options?.clearImmediately) {
        dispatch(
          setEntityListEntities({ listId, entities: [], append: false })
        );
      }

      // Execute immediately if requested, otherwise debounce
      // For initial loads (empty filters and no sort), make it immediate by default
      const shouldBeImmediate =
        options?.fetchImmediately ||
        (Object.keys(newFilters).length === 0 && !newSort);

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }
      if (shouldBeImmediate) {
        loadPage(true);
      } else {
        // Debounce the actual fetch
        debounceTimer.current = setTimeout(() => {
          debounceTimer.current = null;
          loadPage(true);
        }, 800); // 800ms debounce delay
      }
    },
    [dispatch, listId, status, loadPage]
  );

  // Load more function
  const loadMore = useCallback(async () => {
    const list = getList();
    if (!list) {
      console.error(
        `[EntityListRedux] loadMore called before fetchEntities for listId: ${listId}. ` +
        `fetchEntities must be called first to initialize configuration.`
      );
      return;
    }
    await sharedLoadMore(status, {
      hasMore: () => !!getList()?.hasMore,
      retryFirst: () => loadPage(true),
      next: () => loadPage(false),
    });
  }, [getList, listId, status, loadPage]);

  // Reload page 1 with the stored filters, sort and config.
  const refetch = useCallback(async () => {
    if (!getList()) return;
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await loadPage(true);
  }, [getList, loadPage]);

  // Create entity function
  const createEntity = useCallback(
    async ({
      insertPosition,
      ...restOfProps
    }: EntityListCreateEntityProps) => {
      try {
        const newEntity = await entityActions.createEntity({
          listId,
          ...restOfProps,
          // A new entity takes the list's source and space. A list filtered
          // to `"none"` (has none) creates it with no source / no space.
          sourceId: noneToUnset(config?.sourceId),
          spaceId: noneToUnset(config?.spaceId),
          insertPosition,
        });

        return newEntity;
      } catch (err) {
        // Error handling is now done in entityActions.createEntity
        handleError(err, "Failed to create entity");
      }
    },
    [entityActions.createEntity, dispatch, listId, config]
  );

  // Delete entity function
  const deleteEntity = useCallback(
    async ({ entityId }: EntityListDeleteEntityProps) => {
      try {
        await entityActions.deleteEntity({ listId, entityId });
      } catch (err) {
        // Error handling is now done in entityActions.deleteEntity
        handleError(err, "Failed to delete entity");
      }
    },
    [entityActions.deleteEntity, dispatch, listId]
  );

  // Load more entities when page changes - REMOVED
  // This useEffect was causing duplicate API calls and race conditions
  // Load more is now handled directly in the loadMore function

  // fetchEntities now handles fetching directly when called
  // No automatic filter change detection needed

  // Legacy setEntities function for compatibility
  // const handleSetEntities = useCallback(
  //   (updater: React.SetStateAction<Entity[]>) => {
  //     if (typeof updater === "function") {
  //       const newEntities = updater(entities);
  //       dispatch(
  //         setEntityListEntities({
  //           listId,
  //           entities: newEntities,
  //           append: false,
  //         })
  //       );
  //     } else {
  //       dispatch(
  //         setEntityListEntities({ listId, entities: updater, append: false })
  //       );
  //     }
  //   },
  //   [dispatch, listId, entities]
  // );

  // No automatic initialization - state is only created when fetchEntities is called

  return useMemo(
    () => ({
      entities,
      // setEntities: handleSetEntities,
      infusedEntities,

      loading,
      error,
      // A failed load is still to do: `loadMore()` retries it.
      hasMore: hasMore || error !== null,

      // Individual sort properties (flat access for convenience)
      sortBy: sort?.sortBy || null,
      sortByReaction: sort?.sortByReaction || null,
      sortDir: sort?.sortDir || null,
      sortType: sort?.sortType || null,

      // Filter properties
      timeFrame: filters?.timeFrame || null,
      sourceId: config?.sourceId ?? null,
      userId: filters?.userId || null,
      followedOnly: filters?.followedOnly || false,

      keywordsFilters: filters?.keywordsFilters || null,
      titleFilters: filters?.titleFilters || null,
      contentFilters: filters?.contentFilters || null,
      attachmentsFilters: filters?.attachmentsFilters || null,
      locationFilters: filters?.locationFilters || null,
      metadataFilters: filters?.metadataFilters || null,

      fetchEntities: handleFetchEntities,

      loadMore,
      refetch,
      createEntity,
      deleteEntity,
    }),
    [
      entities,
      infusedEntities,
      loading,
      error,
      hasMore,
      sort,
      filters,
      config,
      handleFetchEntities,
      loadMore,
      refetch,
      createEntity,
      deleteEntity,
    ]
  );
}

export default useEntityList;

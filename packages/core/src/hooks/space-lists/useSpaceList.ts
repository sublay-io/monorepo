import { useCallback, useMemo, useRef } from "react";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";

import {
  initializeList,
  updateFilters,
  setSpaceListLoading,
  setSpaceListSpaces,
  incrementPage,
  selectSpaceList,
  selectSpaceListSpaces,
  selectSpaceListLoading,
  selectSpaceListHasMore,
  selectSpaceListFilters,
  selectSpaceListConfig,
  type SpaceListFilters,
  type SpaceListConfig,
  type SpaceListFetchOptions,
} from "../../store/slices/spaceListsSlice";

import useSpaceListActions from "./useSpaceListActions";

import {
  Space,
  ReadingPermission,
  PostingPermission,
} from "../../interfaces/models/Space";
import { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import type { SortDirection } from "../../interfaces/EntityListSortByOptions";

import { handleError } from "../../utils/handleError";

export interface UseSpaceListProps {
  listId: string;
}

export interface SpaceListCreateSpaceProps {
  name: string;
  slug?: string | null;
  description?: string | null;
  // Space images are multipart-only on the server; set them with
  // `useCreateSpace` / `useUpdateSpace`.
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  parentSpaceId?: string | null;
  insertPosition?: "first" | "last";
}

export interface SpaceListDeleteSpaceProps {
  spaceId: string;
}

export interface UseSpaceListValues {
  spaces: Space[];
  loading: boolean;
  hasMore: boolean;

  // Current filters
  sortBy: SpaceListSortByOptions | null;
  sortDir: SortDirection | null;
  query: string | null;
  searchFields: SpaceSearchFields | null;
  /**
   * The parent filter in use: a space id (its direct sub-spaces), `"none"`
   * (top-level, the default) or `"any"` (every level).
   */
  parentSpaceId: string | "none" | "any";

  // Operations
  fetchSpaces: (
    filters: Partial<SpaceListFilters>,
    config?: SpaceListConfig,
    options?: SpaceListFetchOptions
  ) => void;
  loadMore: () => void;
  createSpace: (props: SpaceListCreateSpaceProps) => Promise<Space | undefined>;
  deleteSpace: (props: SpaceListDeleteSpaceProps) => Promise<void>;
}

function useSpaceList({ listId }: UseSpaceListProps): UseSpaceListValues {
  const dispatch = useSublayDispatch();

  // Get state from Redux (parameterized selectors)
  const spaceList = useSublaySelector((state) =>
    selectSpaceList(state, listId)
  );
  const spaces = useSublaySelector((state) =>
    selectSpaceListSpaces(state, listId)
  );
  const loading = useSublaySelector((state) =>
    selectSpaceListLoading(state, listId)
  );
  const hasMore = useSublaySelector((state) =>
    selectSpaceListHasMore(state, listId)
  );
  const filters = useSublaySelector((state) =>
    selectSpaceListFilters(state, listId)
  );
  const config = useSublaySelector((state) =>
    selectSpaceListConfig(state, listId)
  );

  // Get space actions hook
  const spaceActions = useSpaceListActions();

  // Debounce timer for filter changes
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch spaces function (always triggers a fetch)
  const handleFetchSpaces = useCallback(
    (
      newFilters: Partial<SpaceListFilters>,
      newConfig?: SpaceListConfig,
      options?: SpaceListFetchOptions
    ) => {
      // Apply config defaults if not provided
      const configWithDefaults = {
        limit: 20,
        ...newConfig,
      };

      // Ensure Redux state is initialized and update filters/config
      dispatch(initializeList({ listId }));
      dispatch(
        updateFilters({
          listId,
          filters: newFilters,
          config: configWithDefaults,
          options,
        })
      );

      // Clear spaces immediately if requested
      if (options?.clearImmediately) {
        dispatch(setSpaceListSpaces({ listId, spaces: [], append: false }));
      }

      // Define the fetch logic
      const performFetch = async () => {
        // Use the applied config (configWithDefaults is the source of truth for this fetch)
        const currentConfig = { limit: configWithDefaults.limit };

        // Build final filters by taking current state and applying new filters
        const currentState = spaceList || {
          sortBy: "createdAt",
          sortDir: null,
          query: null,
          searchFields: null,
          parentSpaceId: "none",
        };
        const finalFilters = { ...currentState };

        // Apply resetUnspecified logic (only reset filter properties)
        if (options?.resetUnspecified) {
          finalFilters.sortBy = "createdAt";
          finalFilters.sortDir = null;
          finalFilters.query = null;
          finalFilters.searchFields = null;
          finalFilters.parentSpaceId = "none";
        }

        // Apply new filters
        Object.keys(newFilters).forEach((key) => {
          if (newFilters[key as keyof typeof newFilters] !== undefined) {
            (finalFilters as any)[key] =
              newFilters[key as keyof typeof newFilters];
          }
        });

        // `null` on the parent filter means "not set": the default, top-level.
        finalFilters.parentSpaceId = finalFilters.parentSpaceId ?? "none";

        if (!finalFilters.sortBy) return; // sortBy is required

        dispatch(setSpaceListLoading({ listId, loading: true }));

        try {
          await spaceActions.fetchSpaces(listId, {
            page: 1,
            // User-controlled filters from Redux state + new filters
            sortBy: finalFilters.sortBy,
            sortDir: finalFilters.sortDir,
            query: finalFilters.query,
            searchFields: finalFilters.searchFields,
            parentSpaceId: finalFilters.parentSpaceId,
            // Configuration parameters from current config
            limit: currentConfig.limit,
          });
        } catch (err) {
          console.error(
            `[SpaceList] Failed to fetch spaces for listId: ${listId}`,
            err
          );
        }
      };

      // Execute immediately if requested, otherwise debounce
      // For initial loads (empty filters object), make it immediate by default
      const shouldBeImmediate =
        options?.fetchImmediately || Object.keys(newFilters).length === 0;

      if (shouldBeImmediate) {
        performFetch();
      } else {
        // Clear existing debounce timer
        if (debounceTimer.current) {
          clearTimeout(debounceTimer.current);
        }

        // Debounce the actual fetch
        debounceTimer.current = setTimeout(() => {
          performFetch();
        }, 800); // 800ms debounce delay
      }
    },
    [dispatch, listId, spaceList, config, spaceActions.fetchSpaces]
  );

  // Load more function
  const loadMore = useCallback(async () => {
    if (!spaceList || loading || !hasMore) return;

    // Check if fetchSpaces has been called before (safeguard)
    if (!config) {
      console.error(
        `[SpaceList] loadMore called before fetchSpaces for listId: ${listId}. ` +
          `fetchSpaces must be called first to initialize configuration.`
      );
      return;
    }

    const nextPage = spaceList.page + 1;
    dispatch(incrementPage(listId));

    // Directly fetch the next page
    try {
      await spaceActions.fetchSpaces(listId, {
        page: nextPage,
        // User-controlled filters from Redux state
        sortBy: spaceList.sortBy,
        sortDir: spaceList.sortDir,
        query: spaceList.query,
        searchFields: spaceList.searchFields,
        parentSpaceId: spaceList.parentSpaceId,
        // Configuration parameters from state (single source of truth)
        limit: config.limit,
      });
    } catch (err) {
      console.error(
        `[SpaceList] Failed to load more spaces for listId: ${listId}`,
        err
      );
    }
  }, [dispatch, listId, config, spaceList, loading, hasMore, spaceActions.fetchSpaces]);

  // Create space function
  const createSpace = useCallback(
    async ({
      insertPosition,
      ...restOfProps
    }: SpaceListCreateSpaceProps) => {
      try {
        const newSpace = await spaceActions.createSpace(listId, {
          ...restOfProps,
          insertPosition,
        });

        return newSpace;
      } catch (err) {
        handleError(err, "Failed to create space");
      }
    },
    [spaceActions.createSpace, dispatch, listId]
  );

  // Delete space function
  const deleteSpace = useCallback(
    async ({ spaceId }: SpaceListDeleteSpaceProps) => {
      try {
        await spaceActions.deleteSpace(listId, { spaceId });
      } catch (err) {
        handleError(err, "Failed to delete space");
      }
    },
    [spaceActions.deleteSpace, dispatch, listId]
  );

  return useMemo(
    () => ({
      spaces,
      loading,
      hasMore,

      sortBy: filters?.sortBy || null,
      sortDir: filters?.sortDir || null,
      query: filters?.query || null,
      searchFields: filters?.searchFields || null,
      parentSpaceId: filters?.parentSpaceId ?? "none",

      fetchSpaces: handleFetchSpaces,

      loadMore,
      createSpace,
      deleteSpace,
    }),
    [
      spaces,
      loading,
      hasMore,
      filters,
      handleFetchSpaces,
      loadMore,
      createSpace,
      deleteSpace,
    ]
  );
}

export default useSpaceList;

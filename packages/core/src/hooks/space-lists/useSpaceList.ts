import { useCallback, useMemo, useRef } from "react";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
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
  updateFilters,
  setSpaceListLoading,
  setSpaceListSpaces,
  setSpaceListPage,
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
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/models/Space";
import { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import type { SortDirection } from "../../interfaces/EntityListSortByOptions";

import { handleError } from "../../utils/handleError";

export interface UseSpaceListProps {
  listId: string;
}

export interface SpaceListCreateSpaceProps {
  // `null` is the same as leaving the field out.
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  // Space images are multipart-only on the server; set them with
  // `useCreateSpace` / `useUpdateSpace`.
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  parentSpaceId?: string | null;
  insertPosition?: "first" | "last";
}

export interface SpaceListDeleteSpaceProps {
  spaceId: string;
}

export interface UseSpaceListValues {
  spaces: Space[];
  loading: boolean;
  /**
   * The last load failure, shared by every hook on this `listId`. Cleared
   * when the next load starts; `loadMore()` retries it.
   */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
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
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page of this list is loading, while a
   * filter change is waiting to be fetched, or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload page 1 with the list's current filters and page size. The spaces
   * stay until the new page replaces them. Never rejects.
   */
  refetch: () => Promise<void>;
  createSpace: (
    props: SpaceListCreateSpaceProps
  ) => Promise<SpaceWithPermissions | undefined>;
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

  // Load bookkeeping shared by every hook showing this list.
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus(`spaceList:${listId}`);
  const getList = useCallback(
    () => selectSpaceList(store.getState(), listId),
    [store, listId]
  );

  // Debounce timer for filter changes
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load page 1 (`first`) or the page after the last one loaded, with the
  // filters and page size stored for the list — the one request builder, so
  // every page carries the same params.
  const loadPage = useCallback(
    (first: boolean) =>
      runSharedListLoad(
        status,
        // useSpaceListActions logs the failure.
        { first, errorLabel: null },
        async (isCurrent) => {
          const list = getList();
          if (!list || !list.sortBy) return;
          const page = first ? 1 : list.page + 1;
          dispatch(setSpaceListLoading({ listId, loading: true }));
          const data = await spaceActions.fetchSpaces(
            listId,
            {
              page,
              sortBy: list.sortBy,
              sortDir: list.sortDir,
              query: list.query,
              searchFields: list.searchFields,
              parentSpaceId: list.parentSpaceId,
              limit: list.limit,
            },
            isCurrent
          );
          if (isCurrent() && data) {
            dispatch(setSpaceListPage({ listId, page }));
          }
        }
      ),
    [status, getList, dispatch, listId, spaceActions.fetchSpaces]
  );

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

      // A new query: whatever is loading belongs to the old one, and no page
      // loads until this one's first page has been requested.
      status.invalidate();
      status.pendingReset = true;

      // Ensure Redux state is initialized and update filters/config (the
      // slice applies them: `null` on the parent filter is its default).
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

      // Execute immediately if requested, otherwise debounce
      // For initial loads (empty filters object), make it immediate by default
      const shouldBeImmediate =
        options?.fetchImmediately || Object.keys(newFilters).length === 0;

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
        `[SpaceList] loadMore called before fetchSpaces for listId: ${listId}. ` +
          `fetchSpaces must be called first to initialize configuration.`
      );
      return;
    }
    await sharedLoadMore(status, {
      hasMore: () => !!getList()?.hasMore,
      retryFirst: () => loadPage(true),
      next: () => loadPage(false),
    });
  }, [getList, listId, status, loadPage]);

  // Reload page 1 with the stored filters and page size.
  const refetch = useCallback(async () => {
    if (!getList()) {
      console.error(
        `[SpaceList] refetch called before fetchSpaces for listId: ${listId}. ` +
          `fetchSpaces must be called first to initialize configuration.`
      );
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await loadPage(true);
  }, [getList, listId, loadPage]);

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
      error,
      // A failed load is still to do: `loadMore()` retries it.
      hasMore: hasMore || error !== null,

      sortBy: filters?.sortBy || null,
      sortDir: filters?.sortDir || null,
      query: filters?.query || null,
      searchFields: filters?.searchFields || null,
      parentSpaceId: filters?.parentSpaceId ?? "none",

      fetchSpaces: handleFetchSpaces,

      loadMore,
      refetch,
      createSpace,
      deleteSpace,
    }),
    [
      spaces,
      loading,
      error,
      hasMore,
      filters,
      handleFetchSpaces,
      loadMore,
      refetch,
      createSpace,
      deleteSpace,
    ]
  );
}

export default useSpaceList;

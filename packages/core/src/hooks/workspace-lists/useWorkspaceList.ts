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
  updateFilters,
  setWorkspaceListLoading,
  setWorkspaceListWorkspaces,
  setWorkspaceListPage,
  selectWorkspaceList,
  selectWorkspaceListWorkspaces,
  selectWorkspaceListLoading,
  selectWorkspaceListHasMore,
  selectWorkspaceListFilters,
  selectWorkspaceListConfig,
  normalizeWorkspaceInclude,
  WORKSPACE_LIST_DEFAULT_FILTERS,
  type WorkspaceListFilters,
  type WorkspaceListConfig,
  type WorkspaceListFetchOptions,
} from "../../store/slices/workspaceListsSlice";

import useWorkspaceListActions from "./useWorkspaceListActions";

import type {
  Workspace,
  WorkspaceInclude,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/models/Workspace";

import { handleError } from "../../utils/handleError";

export interface UseWorkspaceListProps {
  listId: string;
}

export interface WorkspaceListCreateWorkspaceProps {
  name: string;
  metadata?: Record<string, any>;
  /** The parent for a sub-workspace; left out or `null` for a top-level one. */
  parentWorkspaceId?: string | null;
}

export interface WorkspaceListDeleteWorkspaceProps {
  workspaceId: string;
}

export interface UseWorkspaceListValues {
  workspaces: Workspace[];
  loading: boolean;
  /**
   * The last load failure, shared by every hook on this `listId`. Cleared
   * when the next load starts; `loadMore()` retries it.
   */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;

  // Current filters
  /** `"reachable"` (the default) or `"direct"`. */
  relation: WorkspaceListRelation;
  /** A workspace id, `"none"` (top-level only) or `"any"` (every level, the default). */
  parentWorkspaceId: string | "none" | "any";
  /** `"desc"` (newest first, the default) or `"asc"` (oldest first). */
  sortDir: WorkspaceListSortDir;
  /** Include flags sent with every page, or `null`. */
  include: WorkspaceInclude[] | null;

  // Operations
  fetchWorkspaces: (
    filters: Partial<WorkspaceListFilters>,
    config?: WorkspaceListConfig,
    options?: WorkspaceListFetchOptions
  ) => void;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a page of this list is loading, while a
   * filter change is waiting to be fetched, or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload page 1 with the list's current filters and page size. The
   * workspaces stay until the new page replaces them. Never rejects.
   */
  refetch: () => Promise<void>;
  createWorkspace: (
    props: WorkspaceListCreateWorkspaceProps
  ) => Promise<Workspace | undefined>;
  deleteWorkspace: (props: WorkspaceListDeleteWorkspaceProps) => Promise<void>;
}

type ResolvedFilters = {
  relation: WorkspaceListRelation;
  parentWorkspaceId: string | "none" | "any";
  sortDir: WorkspaceListSortDir;
  include: WorkspaceInclude[] | null;
};

function useWorkspaceList({
  listId,
}: UseWorkspaceListProps): UseWorkspaceListValues {
  const dispatch = useSublayDispatch();

  const workspaceList = useSublaySelector((state) =>
    selectWorkspaceList(state, listId)
  );
  const workspaces = useSublaySelector((state) =>
    selectWorkspaceListWorkspaces(state, listId)
  );
  const loading = useSublaySelector((state) =>
    selectWorkspaceListLoading(state, listId)
  );
  const hasMore = useSublaySelector((state) =>
    selectWorkspaceListHasMore(state, listId)
  );
  const filters = useSublaySelector((state) =>
    selectWorkspaceListFilters(state, listId)
  );
  const config = useSublaySelector((state) =>
    selectWorkspaceListConfig(state, listId)
  );

  const workspaceActions = useWorkspaceListActions();

  // Load bookkeeping shared by every hook showing this list.
  const store = useStore<{ sublay: SublayState }>();
  const { status, error } = useSharedListStatus(`workspaceList:${listId}`);
  const getList = useCallback(
    () => selectWorkspaceList(store.getState(), listId),
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
          if (!list) return;
          const page = first ? 1 : list.page + 1;
          dispatch(setWorkspaceListLoading({ listId, loading: true }));
          const data = await workspaceActions.fetchWorkspaces(
            listId,
            {
              page,
              relation: list.relation,
              parentWorkspaceId: list.parentWorkspaceId,
              sortDir: list.sortDir,
              include: list.include,
              limit: list.limit,
            },
            isCurrent
          );
          if (isCurrent() && data) {
            dispatch(setWorkspaceListPage({ listId, page }));
          }
        }
      ),
    [status, getList, dispatch, listId, workspaceActions.fetchWorkspaces]
  );

  // Fetch workspaces (always triggers a fetch of page 1)
  const handleFetchWorkspaces = useCallback(
    (
      newFilters: Partial<WorkspaceListFilters>,
      newConfig?: WorkspaceListConfig,
      options?: WorkspaceListFetchOptions
    ) => {
      const configWithDefaults = {
        limit: 20,
        ...newConfig,
      };

      // A new query: whatever is loading belongs to the old one, and no page
      // loads until this one's first page has been requested.
      status.invalidate();
      status.pendingReset = true;

      // The slice applies the filters: `undefined` keeps a filter, `null`
      // puts it back to its default.
      dispatch(initializeList({ listId }));
      dispatch(
        updateFilters({
          listId,
          filters: newFilters,
          config: configWithDefaults,
          options,
        })
      );

      if (options?.clearImmediately) {
        dispatch(
          setWorkspaceListWorkspaces({ listId, workspaces: [], append: false })
        );
      }

      // Immediate if requested, or for an initial load (empty filters object);
      // otherwise debounced.
      const shouldBeImmediate =
        options?.fetchImmediately || Object.keys(newFilters).length === 0;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      if (shouldBeImmediate) {
        loadPage(true);
      } else {
        debounceTimer.current = setTimeout(() => {
          debounceTimer.current = null;
          loadPage(true);
        }, 800);
      }
    },
    [dispatch, listId, status, loadPage]
  );

  // Load more function
  const loadMore = useCallback(async () => {
    const list = getList();
    if (!list) {
      console.error(
        `[WorkspaceList] loadMore called before fetchWorkspaces for listId: ${listId}. ` +
          `fetchWorkspaces must be called first to initialize configuration.`
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
        `[WorkspaceList] refetch called before fetchWorkspaces for listId: ${listId}. ` +
          `fetchWorkspaces must be called first to initialize configuration.`
      );
      return;
    }
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = null;
    }
    await loadPage(true);
  }, [getList, listId, loadPage]);

  // Keyed as a string, never the array itself, in the dependency list below.
  const includeKey = workspaceList?.include?.join(",") ?? "";

  const createWorkspace = useCallback(
    async (props: WorkspaceListCreateWorkspaceProps) => {
      try {
        return await workspaceActions.createWorkspace(listId, {
          ...props,
          include: normalizeWorkspaceInclude(includeKey),
        });
      } catch (err) {
        handleError(err, "Failed to create workspace");
      }
    },
    [workspaceActions.createWorkspace, listId, includeKey]
  );

  const deleteWorkspace = useCallback(
    async ({ workspaceId }: WorkspaceListDeleteWorkspaceProps) => {
      try {
        await workspaceActions.deleteWorkspace(listId, { workspaceId });
      } catch (err) {
        handleError(err, "Failed to delete workspace");
      }
    },
    [workspaceActions.deleteWorkspace, listId]
  );

  return useMemo(
    () => ({
      workspaces,
      loading,
      error,
      // A failed load is still to do: `loadMore()` retries it.
      hasMore: hasMore || error !== null,

      relation: filters?.relation ?? WORKSPACE_LIST_DEFAULT_FILTERS.relation,
      parentWorkspaceId:
        filters?.parentWorkspaceId ??
        WORKSPACE_LIST_DEFAULT_FILTERS.parentWorkspaceId,
      sortDir: filters?.sortDir ?? WORKSPACE_LIST_DEFAULT_FILTERS.sortDir,
      include: filters?.include ?? null,

      fetchWorkspaces: handleFetchWorkspaces,
      loadMore,
      refetch,
      createWorkspace,
      deleteWorkspace,
    }),
    [
      workspaces,
      loading,
      error,
      hasMore,
      filters,
      handleFetchWorkspaces,
      loadMore,
      refetch,
      createWorkspace,
      deleteWorkspace,
    ]
  );
}

export default useWorkspaceList;

import { useCallback, useMemo, useRef } from "react";
import { useSublayDispatch, useSublaySelector } from "../../store/hooks";

import {
  initializeList,
  updateFilters,
  setWorkspaceListLoading,
  setWorkspaceListWorkspaces,
  incrementPage,
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
  loadMore: () => void;
  refetch: () => void;
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

  // Debounce timer for filter changes
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

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

      const performFetch = async () => {
        // Same rules as the slice: start from the current filters (or the
        // defaults after resetUnspecified), `undefined` keeps a filter, `null`
        // puts it back to its default.
        const base: ResolvedFilters =
          workspaceList && !options?.resetUnspecified
            ? {
                relation: workspaceList.relation,
                parentWorkspaceId: workspaceList.parentWorkspaceId,
                sortDir: workspaceList.sortDir,
                include: workspaceList.include,
              }
            : { ...WORKSPACE_LIST_DEFAULT_FILTERS };

        const finalFilters: ResolvedFilters = {
          relation:
            newFilters.relation === undefined
              ? base.relation
              : newFilters.relation ?? WORKSPACE_LIST_DEFAULT_FILTERS.relation,
          parentWorkspaceId:
            newFilters.parentWorkspaceId === undefined
              ? base.parentWorkspaceId
              : newFilters.parentWorkspaceId ??
                WORKSPACE_LIST_DEFAULT_FILTERS.parentWorkspaceId,
          sortDir:
            newFilters.sortDir === undefined
              ? base.sortDir
              : newFilters.sortDir ?? WORKSPACE_LIST_DEFAULT_FILTERS.sortDir,
          include:
            newFilters.include === undefined
              ? base.include
              : normalizeWorkspaceInclude(newFilters.include),
        };

        dispatch(setWorkspaceListLoading({ listId, loading: true }));

        try {
          await workspaceActions.fetchWorkspaces(listId, {
            page: 1,
            ...finalFilters,
            limit: configWithDefaults.limit,
          });
        } catch (err) {
          console.error(
            `[WorkspaceList] Failed to fetch workspaces for listId: ${listId}`,
            err
          );
        }
      };

      // Immediate if requested, or for an initial load (empty filters object);
      // otherwise debounced.
      const shouldBeImmediate =
        options?.fetchImmediately || Object.keys(newFilters).length === 0;

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
        debounceTimer.current = null;
      }

      if (shouldBeImmediate) {
        performFetch();
      } else {
        debounceTimer.current = setTimeout(() => {
          debounceTimer.current = null;
          performFetch();
        }, 800);
      }
    },
    [dispatch, listId, workspaceList, workspaceActions.fetchWorkspaces]
  );

  const loadMore = useCallback(async () => {
    if (!workspaceList || loading || !hasMore) return;

    if (!config) {
      console.error(
        `[WorkspaceList] loadMore called before fetchWorkspaces for listId: ${listId}. ` +
          `fetchWorkspaces must be called first to initialize configuration.`
      );
      return;
    }

    const nextPage = workspaceList.page + 1;
    dispatch(incrementPage(listId));

    try {
      await workspaceActions.fetchWorkspaces(listId, {
        page: nextPage,
        relation: workspaceList.relation,
        parentWorkspaceId: workspaceList.parentWorkspaceId,
        sortDir: workspaceList.sortDir,
        include: workspaceList.include,
        limit: config.limit,
      });
    } catch (err) {
      console.error(
        `[WorkspaceList] Failed to load more workspaces for listId: ${listId}`,
        err
      );
    }
  }, [
    dispatch,
    listId,
    config,
    workspaceList,
    loading,
    hasMore,
    workspaceActions.fetchWorkspaces,
  ]);

  // Reload page 1 with the current filters and page size.
  const refetch = useCallback(() => {
    if (!config) {
      console.error(
        `[WorkspaceList] refetch called before fetchWorkspaces for listId: ${listId}. ` +
          `fetchWorkspaces must be called first to initialize configuration.`
      );
      return;
    }
    handleFetchWorkspaces(
      {},
      { limit: config.limit },
      { fetchImmediately: true }
    );
  }, [config, listId, handleFetchWorkspaces]);

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
      hasMore,

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

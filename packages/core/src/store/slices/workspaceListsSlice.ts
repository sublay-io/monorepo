import { createSlice, PayloadAction, createSelector } from "@reduxjs/toolkit";
import { resetAccountScopedState } from "../actions";
import type { SublayState } from "../sublayReducers";
import type {
  Workspace,
  WorkspaceInclude,
  WorkspaceIncludeParam,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/models/Workspace";

// Individual workspace list state
export interface WorkspaceListState {
  workspaces: Workspace[];
  page: number;
  loading: boolean;
  hasMore: boolean;
  error: string | null;
  lastFetched: number | null;

  // Configuration (set when fetchWorkspaces is called)
  limit: number;

  // Filter state (user-controlled filters only)
  /**
   * `"reachable"` (the default): every workspace the caller can open.
   * `"direct"`: the workspaces the caller owns or has a member row on.
   */
  relation: WorkspaceListRelation;
  /**
   * A workspace id (the workspaces directly under it), `"none"` (top-level
   * workspaces only) or `"any"` (every level, the default).
   */
  parentWorkspaceId: string | "none" | "any";
  /** Creation-time order: `"desc"` (newest first, the default) or `"asc"`. */
  sortDir: WorkspaceListSortDir;
  /** Include flags sent with every page, or `null` for none. */
  include: WorkspaceInclude[] | null;
}

// Root state for all workspace lists
export interface WorkspaceListsState {
  lists: { [listId: string]: WorkspaceListState };
}

// The filter defaults, shared by the slice and the hooks.
export const WORKSPACE_LIST_DEFAULT_FILTERS: {
  relation: WorkspaceListRelation;
  parentWorkspaceId: "any";
  sortDir: WorkspaceListSortDir;
  include: null;
} = {
  relation: "reachable",
  parentWorkspaceId: "any",
  sortDir: "desc",
  include: null,
};

// Default state for a new workspace list
const createDefaultWorkspaceListState = (): WorkspaceListState => ({
  workspaces: [],
  page: 1,
  loading: true,
  hasMore: true,
  error: null,
  lastFetched: null,

  // Default configuration
  limit: 20,

  // Default filters. All of them are sent on every page, so later pages keep
  // them.
  ...WORKSPACE_LIST_DEFAULT_FILTERS,
});

const initialState: WorkspaceListsState = {
  lists: {},
};

// Workspace list filters - used by both the Redux slice and the hooks.
// `null` on any filter means "not set": it puts that filter back to its
// default. Left out (`undefined`): unchanged.
export interface WorkspaceListFilters {
  /** `"reachable"` (default) or `"direct"`. */
  relation?: WorkspaceListRelation | null;
  /** A workspace id, `"none"` or `"any"` (default). */
  parentWorkspaceId?: string | "none" | "any" | null;
  /** `"desc"` (default) or `"asc"`. */
  sortDir?: WorkspaceListSortDir | null;
  /** Include flags, as an array or a comma-separated string. */
  include?: WorkspaceIncludeParam | string | null;
}

// Configuration for workspace list operations
export interface WorkspaceListConfig {
  limit?: number;
}

// Options for workspace list operations
export interface WorkspaceListFetchOptions {
  resetUnspecified?: boolean; // Reset any unspecified filters to their defaults
  fetchImmediately?: boolean; // Skip debouncing, fetch immediately
  clearImmediately?: boolean; // Clear workspaces immediately before fetch starts
}

export interface WorkspaceListFilterUpdatePayload {
  listId: string;
  filters: Partial<WorkspaceListFilters>;
  config?: WorkspaceListConfig;
  options?: WorkspaceListFetchOptions;
}

export interface WorkspaceListInitializePayload {
  listId: string;
}

export interface WorkspaceAddPayload {
  listId: string;
  workspace: Workspace;
}

export interface WorkspaceRemovePayload {
  listId: string;
  workspaceId: string;
}

export interface WorkspaceUpdatePayload {
  listId: string;
  workspaceId: string;
  updates: Partial<Workspace>;
}

export interface WorkspacesSetPayload {
  listId: string;
  workspaces: Workspace[];
  append?: boolean;
}

/**
 * Normalizes an include value (array, comma-separated string, null) to the
 * array the state keeps, or `null` for none.
 */
export function normalizeWorkspaceInclude(
  include: WorkspaceIncludeParam | string | null | undefined
): WorkspaceInclude[] | null {
  if (include == null) return null;
  const values = (Array.isArray(include) ? include : include.split(","))
    .map((v) => v.trim())
    .filter(Boolean) as WorkspaceInclude[];
  return values.length > 0 ? values : null;
}

/**
 * Whether a new workspace belongs in a list with these filters. The creator
 * owns it, so it is in both `direct` and `reachable`; only the parent filter
 * can leave it out.
 */
function matchesParentFilter(
  workspace: Workspace,
  parentWorkspaceId: WorkspaceListState["parentWorkspaceId"]
): boolean {
  if (parentWorkspaceId === "any") return true;
  if (parentWorkspaceId === "none") return workspace.parentWorkspaceId == null;
  return workspace.parentWorkspaceId === parentWorkspaceId;
}

export const workspaceListsSlice = createSlice({
  name: "workspaceLists",
  initialState,
  reducers: {
    // Initialize or get existing list
    initializeList: (
      state,
      action: PayloadAction<WorkspaceListInitializePayload>
    ) => {
      const { listId } = action.payload;
      if (!state.lists[listId]) {
        state.lists[listId] = createDefaultWorkspaceListState();
      }
    },

    // Update filters (unified function)
    updateFilters: (
      state,
      action: PayloadAction<WorkspaceListFilterUpdatePayload>
    ) => {
      const { listId, filters, options } = action.payload;

      if (!state.lists[listId]) {
        state.lists[listId] = createDefaultWorkspaceListState();
      }

      const list = state.lists[listId];

      if (options?.resetUnspecified) {
        Object.assign(list, WORKSPACE_LIST_DEFAULT_FILTERS);
      }

      // `undefined`: unchanged. `null`: back to the default.
      if (filters.relation !== undefined) {
        list.relation =
          filters.relation ?? WORKSPACE_LIST_DEFAULT_FILTERS.relation;
      }
      if (filters.parentWorkspaceId !== undefined) {
        list.parentWorkspaceId =
          filters.parentWorkspaceId ??
          WORKSPACE_LIST_DEFAULT_FILTERS.parentWorkspaceId;
      }
      if (filters.sortDir !== undefined) {
        list.sortDir =
          filters.sortDir ?? WORKSPACE_LIST_DEFAULT_FILTERS.sortDir;
      }
      if (filters.include !== undefined) {
        list.include = normalizeWorkspaceInclude(filters.include);
      }

      if (action.payload.config?.limit !== undefined) {
        list.limit = action.payload.config.limit;
      }

      // Reset pagination when filters change
      list.page = 1;
      list.hasMore = true;
      list.error = null;
    },

    setWorkspaceListLoading: (
      state,
      action: PayloadAction<{ listId: string; loading: boolean }>
    ) => {
      const { listId, loading } = action.payload;
      if (state.lists[listId]) {
        state.lists[listId].loading = loading;
      }
    },

    setWorkspaceListWorkspaces: (
      state,
      action: PayloadAction<WorkspacesSetPayload>
    ) => {
      const { listId, workspaces, append = false } = action.payload;

      if (!state.lists[listId]) {
        state.lists[listId] = createDefaultWorkspaceListState();
      }

      const list = state.lists[listId];

      if (append) {
        // Filter out duplicates when appending
        const existingIds = new Set(list.workspaces.map((w) => w.id));
        const newWorkspaces = workspaces.filter((w) => !existingIds.has(w.id));
        list.workspaces = [...list.workspaces, ...newWorkspaces];
      } else {
        list.workspaces = workspaces;
      }

      list.loading = false;
      list.lastFetched = Date.now();
    },

    incrementPage: (state, action: PayloadAction<string>) => {
      const listId = action.payload;
      if (state.lists[listId]) {
        state.lists[listId].page += 1;
      }
    },

    setWorkspaceListHasMore: (
      state,
      action: PayloadAction<{ listId: string; hasMore: boolean }>
    ) => {
      const { listId, hasMore } = action.payload;
      if (state.lists[listId]) {
        state.lists[listId].hasMore = hasMore;
      }
    },

    setWorkspaceListError: (
      state,
      action: PayloadAction<{ listId: string; error: string | null }>
    ) => {
      const { listId, error } = action.payload;
      if (state.lists[listId]) {
        state.lists[listId].error = error;
        state.lists[listId].loading = false;
      }
    },

    /**
     * Adds a newly created workspace where the server would list it. It is the
     * newest workspace, so it goes first under `desc` and last under `asc` —
     * and under `asc` only once every page is loaded, because until then its
     * place is on a page not fetched yet. A workspace outside the list's
     * parent filter, or already in the list, is left out.
     */
    addWorkspace: (state, action: PayloadAction<WorkspaceAddPayload>) => {
      const { listId, workspace } = action.payload;

      const list = state.lists[listId];
      if (!list) return;
      if (list.workspaces.some((w) => w.id === workspace.id)) return;
      if (!matchesParentFilter(workspace, list.parentWorkspaceId)) return;

      if (list.sortDir === "asc") {
        if (list.hasMore) return;
        list.workspaces.push(workspace);
      } else {
        list.workspaces.unshift(workspace);
      }
    },

    removeWorkspace: (state, action: PayloadAction<WorkspaceRemovePayload>) => {
      const { listId, workspaceId } = action.payload;
      const list = state.lists[listId];
      if (!list) return;
      list.workspaces = list.workspaces.filter((w) => w.id !== workspaceId);
    },

    updateWorkspace: (state, action: PayloadAction<WorkspaceUpdatePayload>) => {
      const { listId, workspaceId, updates } = action.payload;
      const list = state.lists[listId];
      if (!list) return;

      const index = list.workspaces.findIndex((w) => w.id === workspaceId);
      if (index !== -1) {
        list.workspaces[index] = { ...list.workspaces[index], ...updates };
      }
    },

    cleanupList: (state, action: PayloadAction<string>) => {
      delete state.lists[action.payload];
    },

    cleanupOldLists: (state, action: PayloadAction<number>) => {
      const ttl = action.payload;
      const now = Date.now();

      Object.keys(state.lists).forEach((listId) => {
        const list = state.lists[listId];
        if (list.lastFetched && now - list.lastFetched > ttl) {
          delete state.lists[listId];
        }
      });
    },
  },
  extraReducers: (builder) => {
    // Every hand-rolled slice returns to its initial state on an account
    // change; RTK-Query's cache is reset separately.
    builder.addCase(resetAccountScopedState, () => initialState);
  },
});

export const {
  initializeList,
  updateFilters,
  setWorkspaceListLoading,
  setWorkspaceListWorkspaces,
  incrementPage,
  setWorkspaceListHasMore,
  setWorkspaceListError,
  addWorkspace,
  removeWorkspace,
  updateWorkspace,
  cleanupList,
  cleanupOldLists,
} = workspaceListsSlice.actions;

// Base selectors - namespaced state for dual-mode support
const selectWorkspaceListsState = (state: { sublay: SublayState }) =>
  state.sublay.workspaceLists;
const selectListId = (_: { sublay: SublayState }, listId: string) => listId;

export const selectWorkspaceList = createSelector(
  [selectWorkspaceListsState, selectListId],
  (workspaceListsState, listId): WorkspaceListState | undefined =>
    workspaceListsState.lists[listId]
);

export const selectWorkspaceListWorkspaces = createSelector(
  [selectWorkspaceList],
  (list): Workspace[] => list?.workspaces || []
);

export const selectWorkspaceListLoading = createSelector(
  [selectWorkspaceList],
  (list): boolean => list?.loading || false
);

export const selectWorkspaceListHasMore = createSelector(
  [selectWorkspaceList],
  (list): boolean => list?.hasMore || false
);

export const selectWorkspaceListFilters = createSelector(
  [selectWorkspaceList],
  (list) => {
    if (!list) return null;

    return {
      relation: list.relation,
      parentWorkspaceId: list.parentWorkspaceId,
      sortDir: list.sortDir,
      include: list.include,
    };
  }
);

export const selectWorkspaceListConfig = createSelector(
  [selectWorkspaceList],
  (list): { limit: number } | null => {
    if (!list) return null;
    return { limit: list.limit };
  }
);

export default workspaceListsSlice.reducer;

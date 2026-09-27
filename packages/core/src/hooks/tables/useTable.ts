import { useCallback, useEffect, useMemo, useRef } from "react";

import { useSelector } from "react-redux";

import { useSublayDispatch, useSublaySelector } from "../../store/hooks";
import useProject from "../projects/useProject";
import type { PaginationMetadata } from "../../interfaces/PaginatedResponse";
import type { DbFilter, TableRow } from "../../interfaces/models/Table";
import {
  initializeTableView,
  selectTableView,
  setTableView,
  type TableViewState,
} from "../../store/slices/tablesSlice";
import {
  tablesApi,
  useCreateRowMutation,
  useDeleteRowMutation,
  useFetchTableRowsQuery,
  useRestoreRowMutation,
  useUpdateRowMutation,
} from "../../store/api/tablesApi";

export type UseTableOptions = Partial<TableViewState>;

const DEFAULT_VIEW: TableViewState = {
  page: 1,
  limit: 20,
  sortBy: undefined,
  sortDir: undefined,
  filters: [],
  includeDeleted: false,
};

export interface UseTableValues<T extends TableRow = TableRow> {
  rows: T[];
  pagination: PaginationMetadata | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;

  // Query controls (persisted in the tables slice).
  view: TableViewState;
  setView: (view: Partial<TableViewState>) => void;
  setPage: (page: number) => void;
  setFilters: (filters: DbFilter[]) => void;
  setSort: (sortBy: string | undefined, sortDir?: "asc" | "desc") => void;
  setIncludeDeleted: (includeDeleted: boolean) => void;

  // Row mutations (projectId + tableName injected).
  createRow: (data: Record<string, unknown>) => Promise<T>;
  updateRow: (rowId: string, data: Record<string, unknown>) => Promise<T>;
  deleteRow: (
    rowId: string,
    opts?: { force?: boolean },
  ) => Promise<{ deleted: boolean; soft: boolean }>;
  restoreRow: (rowId: string) => Promise<T>;
}

/**
 * React hook for a custom table's rows, backed by RTK Query against the `/db`
 * surface. Returns rows + loading/refetch state plus CRUD actions. The query
 * knobs (page/limit/sort/filters/includeDeleted) live in the `tables` slice so
 * multiple consumers of the same table share one view.
 *
 * Core is hook-only — `@sublay/core` has no imperative client object (React
 * hooks + Redux only), so this hook is the custom-table surface.
 */
export function useTable<T extends TableRow = TableRow>(
  tableName: string,
  options: UseTableOptions = {},
): UseTableValues<T> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();

  const storedView = useSublaySelector((state) =>
    selectTableView(state, tableName),
  );
  const view: TableViewState = storedView ?? { ...DEFAULT_VIEW, ...options };

  // Seed the slice view once (idempotent — initializeTableView no-ops if set).
  useEffect(() => {
    dispatch(initializeTableView({ tableName, view: options }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tableName]);

  const queryArgs = useMemo(
    () => ({
      projectId: projectId as string,
      tableName,
      page: view.page,
      limit: view.limit,
      sortBy: view.sortBy,
      sortDir: view.sortDir,
      filters: view.filters,
      includeDeleted: view.includeDeleted,
    }),
    [
      projectId,
      tableName,
      view.page,
      view.limit,
      view.sortBy,
      view.sortDir,
      view.filters,
      view.includeDeleted,
    ],
  );

  const { currentData, isFetching, error, refetch } = useFetchTableRowsQuery(
    queryArgs,
    { skip: !projectId },
  );

  // Which page to show while a request is in flight.
  //
  // RTK Query's `data` is the last result for ANY arg this hook instance has
  // held, which conflates two different changes. A page/sort/filter change
  // should keep the previous rows on screen — blanking the grid on every
  // click is worse than a moment of staleness. A change of *table* (or of
  // project) must not: another table's rows under this table's name is wrong
  // data, not stale data, and `data` reports it with `loading: false` and no
  // error.
  //
  // So remember the ARGS of the last page shown, and re-read that page out of
  // RTK Query's own cache. Keeping the fallback inside the cache is what makes
  // it safe: `resetApiState()` on sign-out or account switch, tag
  // invalidation, and `keepUnusedDataFor` eviction all apply to it for free. A
  // second copy held in a ref would survive all three and quietly serve the
  // previous session's rows — the same bug one axis over.
  const lastShownArgs = useRef<typeof queryArgs | null>(null);
  useEffect(() => {
    if (currentData) lastShownArgs.current = queryArgs;
  }, [currentData, queryArgs]);

  // Only fall back within the same project AND table; every other part of the
  // args (page, sort, filters) is what we deliberately show stale.
  const prev = lastShownArgs.current;
  const fallbackArgs =
    !currentData &&
    prev &&
    prev.projectId === queryArgs.projectId &&
    prev.tableName === queryArgs.tableName
      ? prev
      : null;
  // `useSublaySelector` is typed to the `sublay` namespace only, while the API
  // reducer is mounted beside it at the root, so this one read goes through
  // the untyped selector.
  const fallbackPage = useSelector((state: unknown) => {
    if (!fallbackArgs) return undefined;
    const selectPrev = tablesApi.endpoints.fetchTableRows.select(fallbackArgs);
    return selectPrev(state as Parameters<typeof selectPrev>[0]).data;
  });

  const shownPage = currentData ?? fallbackPage;

  const [createRowMutation] = useCreateRowMutation();
  const [updateRowMutation] = useUpdateRowMutation();
  const [deleteRowMutation] = useDeleteRowMutation();
  const [restoreRowMutation] = useRestoreRowMutation();

  const update = useCallback(
    (next: Partial<TableViewState>) =>
      dispatch(setTableView({ tableName, view: next })),
    [dispatch, tableName],
  );

  const createRow = useCallback(
    async (rowData: Record<string, unknown>) => {
      const res = await createRowMutation({
        projectId: projectId as string,
        tableName,
        data: rowData,
      }).unwrap();
      return res.row as T;
    },
    [createRowMutation, projectId, tableName],
  );

  const updateRow = useCallback(
    async (rowId: string, rowData: Record<string, unknown>) => {
      const res = await updateRowMutation({
        projectId: projectId as string,
        tableName,
        rowId,
        data: rowData,
      }).unwrap();
      return res.row as T;
    },
    [updateRowMutation, projectId, tableName],
  );

  const deleteRow = useCallback(
    async (rowId: string, opts?: { force?: boolean }) =>
      deleteRowMutation({
        projectId: projectId as string,
        tableName,
        rowId,
        force: opts?.force,
      }).unwrap(),
    [deleteRowMutation, projectId, tableName],
  );

  const restoreRow = useCallback(
    async (rowId: string) => {
      const res = await restoreRowMutation({
        projectId: projectId as string,
        tableName,
        rowId,
      }).unwrap();
      return res.row as T;
    },
    [restoreRowMutation, projectId, tableName],
  );

  return useMemo<UseTableValues<T>>(
    () => ({
      rows: (shownPage?.data as T[]) ?? [],
      pagination: shownPage?.pagination ?? null,
      // Nothing to show and a request in flight: the first load, and a
      // tableName change. A page/sort/filter change keeps the previous page
      // visible and stays false.
      loading: isFetching && shownPage === undefined,
      error,
      refetch,
      view,
      setView: update,
      setPage: (page) => update({ page }),
      setFilters: (filters) => update({ filters, page: 1 }),
      setSort: (sortBy, sortDir) => update({ sortBy, sortDir, page: 1 }),
      setIncludeDeleted: (includeDeleted) => update({ includeDeleted, page: 1 }),
      createRow,
      updateRow,
      deleteRow,
      restoreRow,
    }),
    [
      shownPage,
      isFetching,
      error,
      refetch,
      view,
      update,
      createRow,
      updateRow,
      deleteRow,
      restoreRow,
    ],
  );
}

export default useTable;

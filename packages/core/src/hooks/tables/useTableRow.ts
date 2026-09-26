import { useCallback, useMemo } from "react";

import useProject from "../projects/useProject";
import type { TableRow } from "../../interfaces/models/Table";
import { useFetchTableRowQuery } from "../../store/api/tablesApi";

export interface UseTableRowValues<T extends TableRow = TableRow> {
  row: T | null;
  loading: boolean;
  error: unknown;
  refetch: () => void;
}

/**
 * React hook for a single custom-table row, backed by RTK Query against
 * `GET /db/:tableName/:rowId`.
 *
 * `useTable` is list-shaped — it owns a page of rows plus the view state
 * (page/sort/filters) behind it. A detail view wants one row by id and none of
 * that, and filtering a fetched page client-side only works when the row
 * happens to be on the current page. This hook is that read.
 *
 * `rowId` may be `null`/`undefined` (a route param that has not resolved yet);
 * the request is skipped until it is present, so callers do not need to guard
 * the call site.
 *
 * Row writes stay on `useTable`. They invalidate the row's cache tag, so an
 * edit made there refreshes this hook without the two being wired together.
 */
export function useTableRow<T extends TableRow = TableRow>(
  tableName: string,
  rowId: string | null | undefined,
): UseTableRowValues<T> {
  const { projectId } = useProject();
  const skip = !projectId || !rowId;

  const { currentData, isLoading, isFetching, error, refetch } =
    useFetchTableRowQuery(
      {
        projectId: projectId as string,
        tableName,
        rowId: rowId as string,
      },
      { skip },
    );

  // `currentData`, not `data`: `data` is the last result for ANY arg this hook
  // instance has held, so on a rowId change it keeps serving the PREVIOUS row
  // until the new one lands. For a read-by-id that means rendering the wrong
  // record — the list-shaped `useTable` can live with the equivalent (a stale
  // page is still that table's data), a detail view cannot.
  const safeRefetch = useCallback(() => {
    // RTK Query throws "Cannot refetch a query that has not been started yet"
    // on a skipped query, and this hook invites a null rowId, so a Retry button
    // mounted before a route param resolves would throw.
    if (skip) return;
    refetch();
  }, [skip, refetch]);

  return useMemo<UseTableRowValues<T>>(
    () => ({
      // An errored refetch retains the last good value for the cache key; a
      // detail view that reads `row` before `error` would render a row the
      // server just told us is gone.
      row: error ? null : ((currentData?.row as T) ?? null),
      // True only when there is nothing to show and a request is in flight:
      // the first load, and a rowId change. A background refetch (an edit made
      // through `useTable` invalidating this row) keeps the current row on
      // screen rather than flashing a spinner. A skipped query never loads.
      loading: isLoading || (isFetching && currentData === undefined),
      error,
      refetch: safeRefetch,
    }),
    [currentData, isLoading, isFetching, error, safeRefetch],
  );
}

export default useTableRow;

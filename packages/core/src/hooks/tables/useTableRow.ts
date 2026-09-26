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
 * Did the server tell us this row no longer exists, as opposed to failing to
 * answer? `fetchBaseQuery` puts the HTTP status on `error.status`; a transport
 * failure yields a string status ("FETCH_ERROR") instead, which is precisely
 * the case we must NOT treat as "gone".
 */
function isRowGone(error: unknown): boolean {
  if (!error || typeof error !== "object" || !("status" in error)) return false;
  const status = (error as { status: unknown }).status;
  return status === 404 || status === 410;
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

  const { currentData, isFetching, error, refetch } = useFetchTableRowQuery(
    {
      projectId: projectId as string,
      tableName,
      rowId: rowId as string,
    },
    { skip },
  );

  const safeRefetch = useCallback(() => {
    // RTK Query throws "Cannot refetch a query that has not been started yet"
    // on a skipped query, and this hook invites a null rowId, so a Retry button
    // mounted before a route param resolves would throw.
    if (skip) return;
    refetch();
  }, [skip, refetch]);

  return useMemo<UseTableRowValues<T>>(() => {
    // `currentData`, not `data`: `data` is the last result for ANY arg this
    // hook instance has held, so on a rowId change it keeps serving the
    // PREVIOUS row until the new one lands. For a read-by-id that means
    // rendering the wrong record.
    //
    // A failed request keeps its last good value in the cache. Drop it only
    // when the server said the row is GONE — a 404 must not leave a deleted
    // record on screen. A transient failure (500, offline) keeps the last good
    // row alongside `error`, so a detail view degrades to stale-plus-banner
    // rather than to a blank page, and one consumer's failed refetch cannot
    // blank another consumer's view of a perfectly healthy row.
    const row = isRowGone(error) ? null : ((currentData?.row as T) ?? null);

    return {
      row,
      // True whenever a request is in flight and there is nothing to render:
      // the first load, a rowId change, and a retry after the row was dropped.
      // A background refetch with a row still on screen (an edit made through
      // `useTable` invalidating this row) stays false rather than flashing a
      // spinner. Derived from `row` rather than `currentData` so it cannot
      // drift from what the caller actually has. `isLoading` is not consulted:
      // RTK Query only reports it when it has no data, which this already
      // covers.
      loading: isFetching && row === null,
      error,
      refetch: safeRefetch,
    };
  }, [currentData, isFetching, error, safeRefetch]);
}

export default useTableRow;

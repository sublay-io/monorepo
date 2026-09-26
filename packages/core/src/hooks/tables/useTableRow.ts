import { useMemo } from "react";

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

  const { data, isLoading, error, refetch } = useFetchTableRowQuery(
    {
      projectId: projectId as string,
      tableName,
      rowId: rowId as string,
    },
    { skip: !projectId || !rowId },
  );

  return useMemo<UseTableRowValues<T>>(
    () => ({
      row: (data?.row as T) ?? null,
      // A skipped query never loads, so a caller waiting on an unresolved
      // `rowId` sees `loading: false` with `row: null` rather than a spinner
      // that never resolves.
      loading: isLoading,
      error,
      refetch,
    }),
    [data, isLoading, error, refetch],
  );
}

export default useTableRow;

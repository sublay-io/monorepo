import { baseApi } from "./baseApi";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { DbFilter, TableRow } from "../../interfaces/models/Table";

/**
 * RTK Query endpoints for the custom-table `/db` row surface. Mirrors
 * `entityListsApi` end to end: injected into `baseApi`, tagged for cache
 * invalidation, hooks generated below.
 */

interface FetchTableRowsParams {
  projectId: string;
  tableName: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortDir?: "asc" | "desc";
  filters?: DbFilter[];
  includeDeleted?: boolean;
}

interface FetchTableRowParams {
  projectId: string;
  tableName: string;
  rowId: string;
}

interface CreateRowParams {
  projectId: string;
  tableName: string;
  data: Record<string, unknown>;
}

interface UpdateRowParams {
  projectId: string;
  tableName: string;
  rowId: string;
  data: Record<string, unknown>;
}

interface DeleteRowParams {
  projectId: string;
  tableName: string;
  rowId: string;
  force?: boolean;
}

interface RestoreRowParams {
  projectId: string;
  tableName: string;
  rowId: string;
}

const listTag = (projectId: string, tableName: string) =>
  `${projectId}-${tableName}-LIST`;

export const tablesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    fetchTableRows: builder.query<
      PaginatedResponse<TableRow>,
      FetchTableRowsParams
    >({
      query: ({
        projectId,
        tableName,
        page,
        limit,
        sortBy,
        sortDir,
        filters,
        includeDeleted,
      }) => {
        const params: Record<string, unknown> = {};
        if (page !== undefined) params.page = page;
        if (limit !== undefined) params.limit = limit;
        if (sortBy !== undefined) params.sortBy = sortBy;
        if (sortDir !== undefined) params.sortDir = sortDir;
        if (filters && filters.length > 0)
          params.filters = JSON.stringify(filters);
        if (includeDeleted !== undefined)
          params.includeDeleted = includeDeleted ? "true" : "false";

        return {
          url: `/${projectId}/db/${tableName}`,
          method: "GET",
          params,
        };
      },
      providesTags: (result, _error, { projectId, tableName }) => [
        { type: "TableRow" as const, id: listTag(projectId, tableName) },
        ...(result?.data?.map(({ id }) => ({
          type: "TableRow" as const,
          id,
        })) ?? []),
      ],
    }),

    fetchTableRow: builder.query<{ row: TableRow }, FetchTableRowParams>({
      query: ({ projectId, tableName, rowId }) => ({
        url: `/${projectId}/db/${tableName}/${rowId}`,
        method: "GET",
      }),
      // Tagged by row id only — the row-level mutations below already
      // invalidate that id, so a detail view stays in step with an edit made
      // through `useTable` without either hook knowing about the other.
      providesTags: (_result, _error, { rowId }) => [
        { type: "TableRow" as const, id: rowId },
      ],
    }),

    createRow: builder.mutation<{ row: TableRow }, CreateRowParams>({
      query: ({ projectId, tableName, data }) => ({
        url: `/${projectId}/db/${tableName}`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: (_result, _error, { projectId, tableName }) => [
        { type: "TableRow", id: listTag(projectId, tableName) },
      ],
    }),

    updateRow: builder.mutation<{ row: TableRow }, UpdateRowParams>({
      query: ({ projectId, tableName, rowId, data }) => ({
        url: `/${projectId}/db/${tableName}/${rowId}`,
        method: "PATCH",
        body: data,
      }),
      invalidatesTags: (_result, _error, { projectId, tableName, rowId }) => [
        { type: "TableRow", id: rowId },
        { type: "TableRow", id: listTag(projectId, tableName) },
      ],
    }),

    deleteRow: builder.mutation<
      { deleted: boolean; soft: boolean },
      DeleteRowParams
    >({
      query: ({ projectId, tableName, rowId, force }) => ({
        url: `/${projectId}/db/${tableName}/${rowId}`,
        method: "DELETE",
        params: force ? { force: "true" } : undefined,
      }),
      invalidatesTags: (_result, _error, { projectId, tableName, rowId }) => [
        { type: "TableRow", id: rowId },
        { type: "TableRow", id: listTag(projectId, tableName) },
      ],
    }),

    restoreRow: builder.mutation<{ row: TableRow }, RestoreRowParams>({
      query: ({ projectId, tableName, rowId }) => ({
        url: `/${projectId}/db/${tableName}/${rowId}/restore`,
        method: "POST",
      }),
      invalidatesTags: (_result, _error, { projectId, tableName, rowId }) => [
        { type: "TableRow", id: rowId },
        { type: "TableRow", id: listTag(projectId, tableName) },
      ],
    }),
  }),
});

export const {
  useFetchTableRowsQuery,
  useLazyFetchTableRowsQuery,
  useFetchTableRowQuery,
  useLazyFetchTableRowQuery,
  useCreateRowMutation,
  useUpdateRowMutation,
  useDeleteRowMutation,
  useRestoreRowMutation,
} = tablesApi;

export const {
  fetchTableRows,
  fetchTableRow,
  createRow,
  updateRow,
  deleteRow,
  restoreRow,
} = tablesApi.endpoints;

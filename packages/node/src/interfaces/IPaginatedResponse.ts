export interface PaginationMetadata {
  page: number;
  pageSize: number;
  totalPages: number;
  totalItems: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Cursor pagination (comment lists). `nextCursor` continues after the last
 * item of this page — pass it back as `cursor` — and is `null` when `hasMore`
 * is `false`. `hasMore` is exact.
 */
export interface CursorPagination {
  nextCursor: string | null;
  hasMore: boolean;
}

export interface CursorPaginatedResponse<T> {
  data: T[];
  pagination: CursorPagination;
}

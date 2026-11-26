import {
  CursorPaginatedResponse,
  PaginatedResponse,
} from "../../interfaces/PaginatedResponse";
import { ListPage } from "./useListLoader";

/**
 * A page-number list's `fetchPage`: the engine's cursor is the page number to
 * fetch next (`null` = page 1). `fetch` gets the page number and builds the
 * rest of the request itself, the same way for every page.
 */
export function pageNumberPaging<T>(
  fetch: (page: number) => Promise<PaginatedResponse<T> | null | undefined>,
): (cursor: number | null) => Promise<ListPage<T, number>> {
  return async (cursor) => {
    const page = cursor ?? 1;
    const response = await fetch(page);
    return {
      items: response?.data ?? [],
      hasMore: response?.pagination.hasMore ?? false,
      nextCursor: page + 1,
    };
  };
}

/**
 * A cursor list's `fetchPage`: the engine's cursor is the server's
 * `pagination.nextCursor` (`null` = the first page).
 */
export function cursorPaging<T>(
  fetch: (cursor: string | null) => Promise<CursorPaginatedResponse<T>>,
): (cursor: string | null) => Promise<ListPage<T, string>> {
  return async (cursor) => {
    const { data, pagination } = await fetch(cursor);
    return {
      items: data,
      hasMore: pagination.hasMore,
      nextCursor: pagination.nextCursor,
    };
  };
}

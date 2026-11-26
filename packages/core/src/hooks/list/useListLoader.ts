import { useCallback, useEffect, useRef, useState } from "react";
import { handleError } from "../../utils/handleError";
import { SublayError, toSublayError } from "../../errors/SublayError";

/**
 * One page of a list, in the engine's paging-agnostic shape. `nextCursor` is
 * what the next page is fetched with: the next page number for a page-number
 * list, the server's cursor for a cursor list.
 */
export interface ListPage<TItem, TCursor> {
  items: TItem[];
  hasMore: boolean;
  nextCursor: TCursor | null;
}

export interface UseListLoaderOptions<TItem, TCursor> {
  /** `false`: nothing to list (a missing id, an incomplete filter). The list is cleared and idle. */
  enabled: boolean;
  /**
   * The query's identity, as a string. When it changes the list starts over
   * from the first page, and a response still in flight for the old query is
   * dropped. Serialize object and array props into it (never pass them by
   * reference): an inline literal is a new reference every render.
   */
  resetKey: string;
  /**
   * Fetch one page. `cursor` is `null` for the first page, otherwise the
   * `nextCursor` of the last page loaded.
   */
  fetchPage: (cursor: TCursor | null) => Promise<ListPage<TItem, TCursor>>;
  /** A page that is still current. `replace`: it is a first page, so it replaces what is loaded. */
  onPage: (page: ListPage<TItem, TCursor>, replace: boolean) => void;
  /** The query changed or went away: drop what is loaded. Left out: keep it until the first page replaces it. */
  onClear?: () => void;
  /** Load the first page whenever the query changes. `false`: wait for `loadMore()` / `refetch()`. Default `true`. */
  autoLoad?: boolean;
  /**
   * `true`: until the list is first enabled it reports `loading` (a list
   * waiting for the id it lists by). Default `false`: a disabled list is not
   * loading.
   */
  pendingUntilEnabled?: boolean;
  /** Prefix for the logged failure. */
  errorLabel: string;
}

export interface ListLoaderValues {
  loading: boolean;
  /** The last load failure. Cleared when the next load starts. */
  error: SublayError | null;
  /**
   * Whether `loadMore()` has anything to fetch: a next page, or a load that
   * failed (which it retries).
   */
  hasMore: boolean;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while a load is running, when the list is
   * disabled, or when there is nothing more. Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload from the first page with the current query. What is loaded stays
   * until the new first page replaces it. Never rejects.
   */
  refetch: () => Promise<void>;
}

/**
 * The list engine behind every locally held list hook. It owns loading,
 * error, `hasMore`, paging and retry; the caller owns where the items live
 * (`onPage` / `onClear`).
 *
 * - Every load bumps a generation; a response from an older one is dropped,
 *   so a page requested before a query change or a `refetch` never lands.
 * - The in-flight flag is set synchronously, so two `loadMore()` calls in the
 *   same tick load one page.
 * - The cursor only moves on success: a failed page is retried as the same
 *   page, and a failed first page is retried as the first page.
 */
export function useListLoader<TItem, TCursor>(
  options: UseListLoaderOptions<TItem, TCursor>,
): ListLoaderValues {
  const {
    enabled,
    resetKey,
    autoLoad = true,
    pendingUntilEnabled = false,
  } = options;

  const [loading, setLoading] = useState(pendingUntilEnabled || (enabled && autoLoad));
  const [error, setError] = useState<SublayError | null>(null);
  const [hasMore, setHasMore] = useState(true);

  const loadingRef = useRef(false);
  const hasMoreRef = useRef(true);
  const cursorRef = useRef<TCursor | null>(null);
  // A first page of the current query has loaded.
  const loadedRef = useRef(false);
  // Which load failed last, if the last one failed.
  const failedRef = useRef<"first" | "next" | null>(null);
  const generationRef = useRef(0);

  // Always the latest props, so loadMore / refetch keep a stable identity.
  const latest = useRef(options);
  latest.current = options;

  const run = useCallback(async (first: boolean) => {
    const generation = ++generationRef.current;
    // The options of the query this load is for: a page that lands after the
    // next query has rendered (but before its effect has reset the list) is
    // handed to this query's `onPage`, or dropped once the key moved on.
    const request = latest.current;
    loadingRef.current = true;
    failedRef.current = null;
    setLoading(true);
    setError(null);
    try {
      const page = await request.fetchPage(first ? null : cursorRef.current);
      if (
        generation !== generationRef.current ||
        latest.current.resetKey !== request.resetKey ||
        latest.current.enabled !== request.enabled
      ) {
        return;
      }
      request.onPage(page, first);
      loadedRef.current = true;
      cursorRef.current = page.nextCursor;
      hasMoreRef.current = page.hasMore;
      setHasMore(page.hasMore);
    } catch (err) {
      if (generation !== generationRef.current) return;
      if (latest.current.resetKey !== request.resetKey) return;
      failedRef.current = first ? "first" : "next";
      // The failed load is still to do: `loadMore()` retries it.
      hasMoreRef.current = true;
      setHasMore(true);
      setError(toSublayError(err));
      handleError(err, request.errorLabel);
    } finally {
      if (generation === generationRef.current) {
        loadingRef.current = false;
        setLoading(false);
      }
    }
  }, []);

  const hadTargetRef = useRef(false);
  useEffect(() => {
    // Whatever is in flight belongs to the previous query.
    generationRef.current++;
    loadedRef.current = false;
    failedRef.current = null;
    cursorRef.current = null;
    loadingRef.current = false;
    setError(null);

    if (!enabled) {
      // Before there has been a target, a pending list stays as it started.
      if (pendingUntilEnabled && !hadTargetRef.current) return;
      hadTargetRef.current = false;
      hasMoreRef.current = false;
      setHasMore(false);
      setLoading(false);
      latest.current.onClear?.();
      return;
    }

    hadTargetRef.current = true;
    hasMoreRef.current = true;
    setHasMore(true);
    latest.current.onClear?.();
    if (autoLoad) {
      run(true);
    } else {
      setLoading(false);
    }
  }, [enabled, resetKey, autoLoad, pendingUntilEnabled, run]);

  const loadMore = useCallback(async () => {
    if (!latest.current.enabled || loadingRef.current) return;
    if (!loadedRef.current || failedRef.current === "first") {
      await run(true);
    } else if (failedRef.current === "next" || hasMoreRef.current) {
      await run(false);
    }
  }, [run]);

  const refetch = useCallback(async () => {
    if (!latest.current.enabled) return;
    await run(true);
  }, [run]);

  return { loading, error, hasMore, loadMore, refetch };
}

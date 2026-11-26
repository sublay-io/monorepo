import { describe, it, expect, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { jsonResponse, renderHookWithStore, type FetchMockHandle } from "./rtkQueryHarness";
import { resetAccountScopedState } from "../store/actions";

/** What a store-backed list (useEntityList / useSpaceList / useWorkspaceList) exposes to these tests. */
export interface StoreListView {
  ids: string[];
  loading: boolean;
  error: Error | null;
  hasMore: boolean;
  loadMore: () => Promise<void>;
  refetch: () => Promise<void>;
  /** First fetch, no filters: immediate. */
  start: () => void;
  /** A filter change, debounced. */
  changeFilterDebounced: () => void;
  /** A filter change fetched at once. */
  changeFilterNow: () => void;
}

export interface StoreListContractConfig {
  name: string;
  /** Renders one hook on the list `listId`. */
  useList: (listId: string) => StoreListView;
  fetchHandle: () => FetchMockHandle;
  /** The list requests only, in order. */
  listUrls: () => URL[];
  /** The query param a filter change sets, and its value. */
  filterParam: [string, string];
}

function page(ids: string[], hasMore: boolean) {
  return jsonResponse({
    data: ids.map((id) => ({ id })),
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: ids.length, hasMore },
  });
}

/**
 * The list contract on a store-backed list: pages advance one at a time, a
 * failed page is retried as the same page, stale pages are dropped, two hooks
 * on one list share their loads, and an account change starts the status
 * over.
 */
export function describeStoreListContract(config: StoreListContractConfig) {
  const { name, useList, fetchHandle, listUrls, filterParam } = config;
  const pages = () => listUrls().map((u) => u.searchParams.get("page"));
  const mock = () => fetchHandle().fetchMock;

  describe(`${name} — the list contract`, () => {
    it("two loadMore calls in a row fetch pages 2 then 3", async () => {
      mock().mockResolvedValueOnce(page(["1"], true));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["1"]));

      mock().mockResolvedValueOnce(page(["2"], true));
      await act(async () => {
        await result.current.loadMore();
      });
      mock().mockResolvedValueOnce(page(["3"], false));
      await act(async () => {
        await result.current.loadMore();
      });
      expect(pages()).toEqual(["1", "2", "3"]);
      expect(result.current.ids).toEqual(["1", "2", "3"]);
      expect(result.current.hasMore).toBe(false);
    });

    it("a failed page 2 is retried as page 2", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mock().mockResolvedValueOnce(page(["1"], true));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["1"]));

      mock().mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      await act(async () => {
        await result.current.loadMore();
      });
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.hasMore).toBe(true);

      mock().mockResolvedValueOnce(page(["2"], true));
      await act(async () => {
        await result.current.loadMore();
      });
      expect(result.current.error).toBeNull();
      mock().mockResolvedValueOnce(page(["3"], false));
      await act(async () => {
        await result.current.loadMore();
      });
      expect(pages()).toEqual(["1", "2", "2", "3"]);
      vi.restoreAllMocks();
    });

    it("a failed first page sets error and loadMore retries page 1", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mock().mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.loading).toBe(false);
      expect(result.current.hasMore).toBe(true);

      mock().mockResolvedValueOnce(page(["1"], true));
      await act(async () => {
        await result.current.loadMore();
      });
      expect(result.current.ids).toEqual(["1"]);
      expect(pages()).toEqual(["1", "1"]);
      vi.restoreAllMocks();
    });

    it("drops a page that lands after a filter change", async () => {
      mock().mockResolvedValueOnce(page(["old-1"], true));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["old-1"]));

      let release!: (r: Response) => void;
      mock().mockImplementationOnce(() => new Promise<Response>((r) => { release = r; }));
      act(() => {
        result.current.loadMore();
      });
      await waitFor(() => expect(listUrls()).toHaveLength(2));

      mock().mockResolvedValueOnce(page(["new-1"], false));
      act(() => result.current.changeFilterNow());
      await waitFor(() => expect(result.current.ids).toEqual(["new-1"]));

      await act(async () => {
        release(await page(["old-2"], true));
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(result.current.ids).toEqual(["new-1"]);
      expect(result.current.loading).toBe(false);
      expect(listUrls()[2].searchParams.get(filterParam[0])).toBe(filterParam[1]);
    });

    it("loadMore does nothing while a debounced filter change is waiting", async () => {
      mock().mockResolvedValueOnce(page(["1"], true));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["1"]));

      act(() => result.current.changeFilterDebounced());
      await act(async () => {
        await result.current.loadMore();
      });
      expect(listUrls()).toHaveLength(1);
    });

    it("two hooks on the same list calling loadMore in the same tick load one page", async () => {
      mock().mockResolvedValueOnce(page(["1"], true));
      const { result } = renderHookWithStore(() => ({ a: useList("feed"), b: useList("feed") }));
      act(() => result.current.a.start());
      await waitFor(() => expect(result.current.b.ids).toEqual(["1"]));

      mock().mockResolvedValueOnce(page(["2"], true));
      await act(async () => {
        await Promise.all([result.current.a.loadMore(), result.current.b.loadMore()]);
      });
      expect(pages()).toEqual(["1", "2"]);
      expect(result.current.b.ids).toEqual(["1", "2"]);
    });

    it("refetch reloads page 1 and never rejects", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mock().mockResolvedValueOnce(page(["1"], true));
      const { result } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["1"]));
      mock().mockResolvedValueOnce(page(["2"], true));
      await act(async () => {
        await result.current.loadMore();
      });

      mock().mockResolvedValueOnce(page(["fresh"], true));
      await act(async () => {
        await result.current.refetch();
      });
      expect(result.current.ids).toEqual(["fresh"]);
      expect(pages()).toEqual(["1", "2", "1"]);

      mock().mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(result.current.refetch()).resolves.toBeUndefined();
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
      expect(result.current.ids).toEqual(["fresh"]);
      mock().mockResolvedValueOnce(jsonResponse({}, 500));
      await expect(result.current.loadMore()).resolves.toBeUndefined();
      vi.restoreAllMocks();
    });

    it("an account change clears the error and drops a page still in flight", async () => {
      vi.spyOn(console, "error").mockImplementation(() => {});
      mock().mockResolvedValueOnce(jsonResponse({}, 500));
      const { result, store } = renderHookWithStore(() => useList("feed"));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));

      act(() => {
        store.dispatch(resetAccountScopedState());
      });
      expect(result.current.error).toBeNull();

      // A page requested before the next account change lands after it.
      mock().mockResolvedValueOnce(page(["a1"], true));
      act(() => result.current.start());
      await waitFor(() => expect(result.current.ids).toEqual(["a1"]));
      let release!: (r: Response) => void;
      mock().mockImplementationOnce(() => new Promise<Response>((r) => { release = r; }));
      act(() => {
        result.current.loadMore();
      });
      await waitFor(() => expect(listUrls()).toHaveLength(3));

      act(() => {
        store.dispatch(resetAccountScopedState());
      });
      await act(async () => {
        release(await page(["a2"], true));
        await new Promise((r) => setTimeout(r, 20));
      });
      expect(result.current.ids).toEqual([]);
      expect(result.current.error).toBeNull();
      vi.restoreAllMocks();
    });
  });
}

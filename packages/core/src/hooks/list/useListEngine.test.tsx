import { describe, it, expect, vi, afterEach } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";

import { useListEngine } from "./useListEngine";
import { pageNumberPaging } from "./paging";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

type Item = { id: string };

interface Deferred<T> {
  promise: Promise<T>;
  resolve: (value: T) => void;
  reject: (err: unknown) => void;
}

function deferred<T>(): Deferred<T> {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function pageOf(ids: string[], hasMore: boolean): PaginatedResponse<Item> {
  return {
    data: ids.map((id) => ({ id })),
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: ids.length, hasMore },
  };
}

/**
 * A page-number list over a `fetch` spy that records `(filter, page)` for
 * every request; each call gets the next queued deferred response.
 */
function setup(initialFilter = "a", opts: { autoLoad?: boolean; enabled?: boolean } = {}) {
  const queue: Deferred<PaginatedResponse<Item>>[] = [];
  const fetch = vi.fn((_filter: string, _page: number) => {
    const d = deferred<PaginatedResponse<Item>>();
    queue.push(d);
    return d.promise;
  });
  const hook = renderHook(
    ({ filter, enabled }: { filter: string; enabled: boolean }) =>
      useListEngine<Item, number>({
        enabled,
        resetKey: filter,
        autoLoad: opts.autoLoad,
        fetchPage: pageNumberPaging((page) => fetch(filter, page)),
        errorLabel: "test:",
      }),
    { initialProps: { filter: initialFilter, enabled: opts.enabled ?? true } },
  );
  return { ...hook, fetch, queue };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("useListEngine", () => {
  it("loads page 1, then page 2 on loadMore, appending", async () => {
    const { result, fetch, queue } = setup();
    expect(result.current.loading).toBe(true);
    await act(async () => queue[0].resolve(pageOf(["1"], true)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1"]);
    expect(result.current.loading).toBe(false);

    let p!: Promise<void>;
    act(() => {
      p = result.current.loadMore();
    });
    await act(async () => queue[1].resolve(pageOf(["2"], false)));
    await p;
    expect(fetch.mock.calls).toEqual([
      ["a", 1],
      ["a", 2],
    ]);
    expect(result.current.items.map((i) => i.id)).toEqual(["1", "2"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("drops a page that lands after the query changed", async () => {
    const { result, rerender, queue, fetch } = setup();
    await act(async () => queue[0].resolve(pageOf(["a1"], true)));

    // Page 2 of the old filter is in flight when the filter changes.
    act(() => {
      result.current.loadMore();
    });
    rerender({ filter: "b", enabled: true });
    expect(fetch.mock.calls[2]).toEqual(["b", 1]);
    expect(result.current.items).toEqual([]);

    await act(async () => queue[1].resolve(pageOf(["a2"], true)));
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(true);

    await act(async () => queue[2].resolve(pageOf(["b1"], false)));
    expect(result.current.items.map((i) => i.id)).toEqual(["b1"]);
    expect(result.current.loading).toBe(false);
  });

  it("a failed first page sets error, keeps hasMore so it can be retried, and loadMore retries page 1", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, queue, fetch } = setup();
    await act(async () => queue[0].reject(new Error("boom")));

    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("boom");
    expect(result.current.items).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);

    act(() => {
      result.current.loadMore();
    });
    // The retry is page 1 again — not page 2 — and clears the error.
    expect(fetch.mock.calls[1]).toEqual(["a", 1]);
    expect(result.current.error).toBeNull();

    await act(async () => queue[1].resolve(pageOf(["1"], false)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1"]);
    expect(result.current.hasMore).toBe(false);
  });

  it("a failed later page is retried as the same page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, queue, fetch } = setup();
    await act(async () => queue[0].resolve(pageOf(["1"], true)));
    act(() => {
      result.current.loadMore();
    });
    await act(async () => queue[1].reject("not an Error"));
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe("not an Error");

    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls[2]).toEqual(["a", 2]);
    await act(async () => queue[2].resolve(pageOf(["2"], false)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1", "2"]);
  });

  it("two loadMore calls in the same tick load exactly one page", async () => {
    const { result, queue, fetch } = setup();
    await act(async () => queue[0].resolve(pageOf(["1"], true)));

    act(() => {
      result.current.loadMore();
      result.current.loadMore();
    });
    expect(fetch).toHaveBeenCalledTimes(2);
    await act(async () => queue[1].resolve(pageOf(["2"], true)));

    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls.map((c) => c[1])).toEqual([1, 2, 3]);
  });

  it("refetch reloads page 1 with the current query, keeping the items until it lands", async () => {
    const { result, rerender, queue, fetch } = setup();
    await act(async () => queue[0].resolve(pageOf(["a1"], false)));
    rerender({ filter: "b", enabled: true });
    await act(async () => queue[1].resolve(pageOf(["b1"], true)));
    act(() => {
      result.current.loadMore();
    });
    await act(async () => queue[2].resolve(pageOf(["b2"], false)));

    act(() => {
      result.current.refetch();
    });
    expect(fetch.mock.calls[3]).toEqual(["b", 1]);
    expect(result.current.items.map((i) => i.id)).toEqual(["b1", "b2"]);

    await act(async () => queue[3].resolve(pageOf(["b1-new"], true)));
    expect(result.current.items.map((i) => i.id)).toEqual(["b1-new"]);
    expect(result.current.hasMore).toBe(true);

    // Paging continues from the refetched first page.
    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls[4]).toEqual(["b", 2]);
  });

  it("refetch drops a page that was in flight", async () => {
    const { result, queue } = setup();
    await act(async () => queue[0].resolve(pageOf(["1"], true)));
    act(() => {
      result.current.loadMore();
    });
    act(() => {
      result.current.refetch();
    });
    await act(async () => queue[1].resolve(pageOf(["stale-2"], true)));
    await act(async () => queue[2].resolve(pageOf(["1-new"], true)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1-new"]);
  });

  it("loadMore and refetch never reject", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, queue } = setup();
    await act(async () => queue[0].resolve(pageOf(["1"], true)));

    let more!: Promise<void>;
    act(() => {
      more = result.current.loadMore();
    });
    await act(async () => queue[1].reject(new Error("page failed")));
    await expect(more).resolves.toBeUndefined();

    let again!: Promise<void>;
    act(() => {
      again = result.current.refetch();
    });
    await act(async () => queue[2].reject(new Error("refetch failed")));
    await expect(again).resolves.toBeUndefined();
    expect(result.current.error?.message).toBe("refetch failed");
    // A failed refetch keeps what was loaded.
    expect(result.current.items.map((i) => i.id)).toEqual(["1"]);
  });

  it("a disabled list doesn't fetch, isn't loading and has nothing more", async () => {
    const { result, fetch, rerender, queue } = setup("a", { enabled: false });
    await act(async () => {
      await result.current.loadMore();
      await result.current.refetch();
    });
    expect(fetch).not.toHaveBeenCalled();
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(false);

    rerender({ filter: "a", enabled: true });
    expect(fetch).toHaveBeenCalledTimes(1);
    await act(async () => queue[0].resolve(pageOf(["1"], false)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1"]);
  });

  it("with autoLoad off, the first loadMore loads page 1", async () => {
    const { result, fetch, queue } = setup("a", { autoLoad: false });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetch).not.toHaveBeenCalled();

    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls[0]).toEqual(["a", 1]);
    await act(async () => queue[0].resolve(pageOf(["1"], true)));
    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls[1]).toEqual(["a", 2]);
  });

  it("a failed refetch is retried by loadMore as page 1, not the next page", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    const { result, queue, fetch } = setup();
    await act(async () => queue[0].resolve(pageOf(["1"], true)));

    act(() => {
      result.current.refetch();
    });
    await act(async () => queue[1].reject(new Error("refetch failed")));
    expect(result.current.items.map((i) => i.id)).toEqual(["1"]);

    act(() => {
      result.current.loadMore();
    });
    expect(fetch.mock.calls[2]).toEqual(["a", 1]);
    await act(async () => queue[2].resolve(pageOf(["1-new"], false)));
    expect(result.current.items.map((i) => i.id)).toEqual(["1-new"]);
  });
});

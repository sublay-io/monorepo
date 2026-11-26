import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { describeStoreListContract } from "../../test-utils/storeListContract";
import useEntityList from "./useEntityList";

let fetchHandle: FetchMockHandle;

const DEBOUNCE_MS = 800;

function paginated(data: { id: string; foreignId?: string }[], hasMore: boolean) {
  return jsonResponse({
    data,
    pagination: { page: 1, pageSize: 10, totalPages: hasMore ? 2 : 1, totalItems: data.length, hasMore },
  });
}

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useEntityList", () => {
  it("fetches immediately when called with no filters and no sort", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchEntities({}));

    await waitFor(() => expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.sortBy).toBe("hot"); // default
  });

  // Fake timers are deliberately avoided here: they've been observed to corrupt
  // React's internal scheduler across subsequent tests in this file (later hook
  // renders silently fail to commit, leaving `result.current` null). Real timers
  // with a short sleep past the 800ms debounce are slower but reliable.
  it("debounces a fetch triggered by filter/sort changes", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchEntities({ userId: "user-1" }, { sortBy: "createdAt" }));
    expect(fetchHandle.calls()).toHaveLength(0); // not yet — debounced

    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1), {
      timeout: DEBOUNCE_MS + 500,
    });
    expect(result.current.userId).toBe("user-1");
    expect(result.current.sortBy).toBe("createdAt");
  }, 10_000);

  it("fetchImmediately bypasses the debounce even with filters/sort set", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });

    await act(async () => {
      result.current.fetchEntities(
        { userId: "user-1" },
        { sortBy: "createdAt" },
        undefined,
        { fetchImmediately: true },
      );
      await Promise.resolve();
    });

    expect(fetchHandle.calls()).toHaveLength(1);
  });

  it("clearImmediately empties entities synchronously before the (debounced) fetch resolves", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}, undefined, undefined, { fetchImmediately: true }));
    await waitFor(() => expect(result.current.entities).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
    act(() =>
      result.current.fetchEntities({ userId: "user-2" }, undefined, undefined, {
        clearImmediately: true,
      }),
    );
    expect(result.current.entities).toEqual([]); // cleared synchronously, before the debounce fires

    // Let the now-pending debounced fetch resolve so it doesn't leak into the next test.
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2), {
      timeout: DEBOUNCE_MS + 500,
    });
  }, 10_000);

  it("applies resetFilters/resetSort options when fetching immediately", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}, undefined, undefined, { fetchImmediately: true }));
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
    act(() =>
      result.current.fetchEntities(
        { userId: "user-1" },
        { sortBy: "createdAt" },
        undefined,
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));
    expect(result.current.userId).toBe("user-1");
    expect(result.current.sortBy).toBe("createdAt");

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
    act(() =>
      result.current.fetchEntities({}, undefined, undefined, {
        fetchImmediately: true,
        resetFilters: true,
        resetSort: true,
      }),
    );
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(3));
    expect(result.current.userId).toBeNull();
    expect(result.current.sortBy).toBe("hot");
  });

  describe("source and space filters", () => {
    it("shows every entity by default: no sourceId or spaceId is sent, on any page", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchEntities({}));
      await waitFor(() => expect(result.current.entities).toHaveLength(1));
      expect(result.current.sourceId).toBeNull();

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
      await act(async () => {
        await result.current.loadMore();
      });

      const urls = fetchHandle.calls().map((c) => new URL(c.url));
      expect(urls).toHaveLength(2);
      for (const url of urls) {
        expect(url.searchParams.has("sourceId")).toBe(false);
        expect(url.searchParams.has("spaceId")).toBe(false);
        expect(url.search).not.toContain("null");
      }
    });

    it("null sourceId/spaceId are left out; an explicit \"none\" is sent as given, on every page", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() =>
        result.current.fetchEntities({}, undefined, { sourceId: null, spaceId: null }, { fetchImmediately: true }),
      );
      await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1));
      await waitFor(() => expect(result.current.loading).toBe(false));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], true));
      act(() =>
        result.current.fetchEntities({}, undefined, { sourceId: "none", spaceId: "none" }, { fetchImmediately: true }),
      );
      await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));
      await waitFor(() => expect(result.current.hasMore).toBe(true));
      expect(result.current.sourceId).toBe("none");

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e3" }], false));
      await act(async () => {
        await result.current.loadMore();
      });
      await waitFor(() => expect(fetchHandle.calls()).toHaveLength(3));

      const [first, second, third] = fetchHandle.calls().map((c) => new URL(c.url).searchParams);
      expect(first.has("sourceId")).toBe(false);
      expect(first.has("spaceId")).toBe(false);
      expect(second.get("sourceId")).toBe("none");
      expect(second.get("spaceId")).toBe("none");
      expect(third.get("page")).toBe("2");
      expect(third.get("sourceId")).toBe("none");
      expect(third.get("spaceId")).toBe("none");
    });
  });

  describe("loadMore", () => {
    it("is a no-op before fetchEntities has been called (no config yet)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(fetchHandle.calls()).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it("fetches the next page and appends, once initialized", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchEntities({}));
      await waitFor(() => expect(result.current.entities).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.entities.map((e) => e.id)).toEqual(["e1", "e2"]);
      expect(result.current.hasMore).toBe(false);

      const pageCall = fetchHandle.calls().find((c) => new URL(c.url).searchParams.get("page") === "2");
      expect(pageCall).toBeTruthy();
    });

    it("is a no-op while loading or once hasMore is false", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchEntities({}));
      await waitFor(() => expect(result.current.entities).toHaveLength(1));
      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        await result.current.loadMore();
      });
      expect(fetchHandle.calls()).toHaveLength(1); // unchanged — hasMore was false
    });
  });

  describe("createEntity / deleteEntity", () => {
    it("createEntity scopes to the list's configured sourceId/spaceId", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() =>
        result.current.fetchEntities({}, undefined, { sourceId: "source-1" }, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.sourceId).toBe("source-1"));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1", sourceId: "source-1" }, 201));
      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createEntity({ title: "Hello" });
      });

      expect(created?.id).toBe("e1");
      expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]);
    });

    it("createEntity on a list filtered to \"none\" creates the entity with no source and no space", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() =>
        result.current.fetchEntities(
          {},
          undefined,
          { sourceId: "none", spaceId: "none" },
          { fetchImmediately: true },
        ),
      );
      await waitFor(() => expect(result.current.sourceId).toBe("none"));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1", sourceId: null }, 201));
      await act(async () => {
        await result.current.createEntity({ title: "Hello" });
      });

      // The test Request shim keeps the fetch init (with the JSON body) on `init`.
      const createReq = fetchHandle.fetchMock.mock.calls[1][0] as unknown as {
        method: string;
        init: { body?: string };
      };
      expect(createReq.method).toBe("POST");
      const body = JSON.parse(createReq.init.body ?? "{}");
      expect(body).not.toHaveProperty("sourceId");
      expect(body).not.toHaveProperty("spaceId");
    });

    it("deleteEntity removes the entity from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchEntities({}));
      await waitFor(() => expect(result.current.entities).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );
      await act(async () => {
        await result.current.deleteEntity({ entityId: "e1" });
      });

      expect(result.current.entities).toEqual([]);
    });
  });

  it("infusedEntities reflects useInfusedData's output when infuseData is provided", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1", foreignId: "f1" }], false));
    const infuseData = vi.fn(async () => ({ extra: "details" }));
    const { result } = renderHookWithStore(
      () => useEntityList({ listId: "feed", infuseData }),
      { projectId: "test-project" },
    );
    act(() => result.current.fetchEntities({}));
    await waitFor(() => expect(result.current.entities).toHaveLength(1));

    await waitFor(() => expect(result.current.infusedEntities).toHaveLength(1));
    expect(result.current.infusedEntities[0].infusion).toEqual({ extra: "details" });
  });

  it("drops topComments params once include no longer asks for topComments (fetch and loadMore)", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() =>
      result.current.fetchEntities({}, undefined, {
        include: ["topComments"],
        topCommentsLimit: 3,
        topCommentsSortByReaction: "like",
      }),
    );
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1));
    const first = new URL(fetchHandle.calls()[0].url).searchParams;
    expect(first.get("topCommentsLimit")).toBe("3");
    expect(first.get("topCommentsSortByReaction")).toBe("like");

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    act(() => result.current.fetchEntities({}, undefined, { include: ["user"] }));
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));
    await waitFor(() => expect(result.current.hasMore).toBe(true));
    const second = new URL(fetchHandle.calls()[1].url).searchParams;
    expect(second.get("include")).toBe("user");
    expect(second.has("topCommentsLimit")).toBe(false);
    expect(second.has("topCommentsSortByReaction")).toBe(false);

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(3));
    const third = new URL(fetchHandle.calls()[2].url).searchParams;
    expect(third.get("page")).toBe("2");
    expect(third.has("topCommentsLimit")).toBe(false);
    expect(third.has("topCommentsSortByReaction")).toBe(false);
  });

  async function fetchTwiceThenLoadMore(
    firstConfig: Record<string, unknown>,
    secondConfig: Record<string, unknown>,
  ) {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}, undefined, firstConfig as any));
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1));
    await waitFor(() => expect(result.current.loading).toBe(false));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    act(() => result.current.fetchEntities({}, undefined, secondConfig as any));
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));
    await waitFor(() => expect(result.current.hasMore).toBe(true));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
    await act(async () => {
      await result.current.loadMore();
    });
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(3));
    return fetchHandle.calls().map((c) => new URL(c.url).searchParams);
  }

  it("each fetchEntities call sets the whole config: an omitted spaceId isn't kept for loadMore", async () => {
    const [first, second, third] = await fetchTwiceThenLoadMore({ spaceId: "s1" }, {});
    // No space filter: the param is left out.
    expect(first.get("spaceId")).toBe("s1");
    expect(second.has("spaceId")).toBe(false);
    expect(third.get("page")).toBe("2");
    expect(third.has("spaceId")).toBe(false);
  });

  it("an omitted spaceReputation isn't kept for loadMore", async () => {
    const [first, , third] = await fetchTwiceThenLoadMore(
      { spaceReputation: { spaceId: "space-7", includeDescendants: true } },
      {},
    );
    expect(first.get("spaceReputationId")).toBe("space-7");
    expect(first.get("spaceReputationDescendants")).toBe("true");
    expect(third.has("spaceReputationId")).toBe(false);
    expect(third.has("spaceReputationDescendants")).toBe(false);
  });

  it("loadMore keeps the current fetch's spaceReputation", async () => {
    const [, second, third] = await fetchTwiceThenLoadMore(
      {},
      { spaceReputation: { spaceId: "context" } },
    );
    expect(second.get("spaceReputationId")).toBe("context");
    expect(third.get("page")).toBe("2");
    expect(third.get("spaceReputationId")).toBe("context");
    expect(third.has("spaceReputationDescendants")).toBe(false);
  });

  it("an omitted topCommentsLimit isn't kept for loadMore even while include still has topComments", async () => {
    const [first, second, third] = await fetchTwiceThenLoadMore(
      { include: ["topComments"], topCommentsLimit: 3, topCommentsSortByReaction: "like" },
      { include: ["topComments"] },
    );
    expect(first.get("topCommentsLimit")).toBe("3");
    expect(second.has("topCommentsLimit")).toBe(false);
    expect(third.get("include")).toBe("topComments");
    expect(third.has("topCommentsLimit")).toBe(false);
    expect(third.has("topCommentsSortByReaction")).toBe(false);
  });
});

describe("useEntityList — the list contract", () => {
  const pageParam = (i: number) => new URL(fetchHandle.calls()[i].url).searchParams;

  it("drops a page that lands after fetchEntities started a new query", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "a1" }], true));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}));
    await waitFor(() => expect(result.current.entities.map((e) => e.id)).toEqual(["a1"]));

    let releaseStale!: (r: Response) => void;
    fetchHandle.fetchMock.mockImplementationOnce(
      () => new Promise<Response>((resolve) => { releaseStale = resolve; }),
    );
    act(() => {
      result.current.loadMore();
    });
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "b1" }], false));
    act(() =>
      result.current.fetchEntities({ userId: "user-b" }, undefined, undefined, {
        fetchImmediately: true,
      }),
    );
    await waitFor(() => expect(result.current.entities.map((e) => e.id)).toEqual(["b1"]));

    await act(async () => {
      releaseStale(await paginated([{ id: "a2" }], true));
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current.entities.map((e) => e.id)).toEqual(["b1"]);
    expect(result.current.hasMore).toBe(false);
    expect(result.current.loading).toBe(false);
    expect(pageParam(2).get("userId")).toBe("user-b");
    expect(pageParam(2).get("page")).toBe("1");
  });

  it("a failed first page sets error and loadMore retries page 1", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}));
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.loading).toBe(false);
    expect(result.current.hasMore).toBe(true);

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.error).toBeNull();
    expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]);
    expect(pageParam(1).get("page")).toBe("1");

    // And the page after that is page 2, not 3.
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], false));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(pageParam(2).get("page")).toBe("2");
    vi.restoreAllMocks();
  });

  it("two hooks on the same listId calling loadMore in the same tick load one page", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    const { result } = renderHookWithStore(
      () => ({
        a: useEntityList({ listId: "feed" }),
        b: useEntityList({ listId: "feed" }),
      }),
      { projectId: "test-project" },
    );
    act(() => result.current.a.fetchEntities({}));
    await waitFor(() => expect(result.current.b.entities.map((e) => e.id)).toEqual(["e1"]));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], true));
    await act(async () => {
      await Promise.all([result.current.a.loadMore(), result.current.b.loadMore()]);
    });
    expect(fetchHandle.calls()).toHaveLength(2);
    expect(result.current.a.entities.map((e) => e.id)).toEqual(["e1", "e2"]);
    expect(pageParam(1).get("page")).toBe("2");
  });

  it("refetch reloads page 1 with the stored filters and config", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() =>
      result.current.fetchEntities(
        { userId: "user-1" },
        { sortBy: "createdAt" },
        { limit: 5, sourceId: "src" },
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(result.current.entities).toHaveLength(1));
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e2" }], true));
    await act(async () => {
      await result.current.loadMore();
    });

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "fresh" }], false));
    await act(async () => {
      await result.current.refetch();
    });
    expect(result.current.entities.map((e) => e.id)).toEqual(["fresh"]);
    const params = pageParam(2);
    expect(params.get("page")).toBe("1");
    expect(params.get("userId")).toBe("user-1");
    expect(params.get("sortBy")).toBe("createdAt");
    expect(params.get("limit")).toBe("5");
    expect(params.get("sourceId")).toBe("src");
  });

  it("loadMore and refetch never reject", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], true));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchEntities({}));
    await waitFor(() => expect(result.current.entities).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(result.current.loadMore()).resolves.toBeUndefined();
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({}, 500));
    await expect(result.current.refetch()).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.error).toBeInstanceOf(Error));
    expect(result.current.entities.map((e) => e.id)).toEqual(["e1"]);
    vi.restoreAllMocks();
  });
});

describeStoreListContract({
  name: "useEntityList",
  useList: (listId) => {
    const list = useEntityList({ listId });
    return {
      ids: list.entities.map((e) => e.id),
      loading: list.loading,
      error: list.error,
      hasMore: list.hasMore,
      loadMore: list.loadMore,
      refetch: list.refetch,
      start: () => list.fetchEntities({}),
      changeFilterDebounced: () => list.fetchEntities({ userId: "user-b" }),
      changeFilterNow: () =>
        list.fetchEntities({ userId: "user-b" }, undefined, undefined, { fetchImmediately: true }),
    };
  },
  fetchHandle: () => fetchHandle,
  listUrls: () =>
    fetchHandle
      .calls()
      .map((c) => new URL(c.url))
      .filter((u) => /\/entities$/.test(u.pathname)),
  filterParam: ["userId", "user-b"],
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
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

    act(() => result.current.fetchEntities({ userId: "user-1" }, { sortBy: "new" }));
    expect(fetchHandle.calls()).toHaveLength(0); // not yet — debounced

    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1), {
      timeout: DEBOUNCE_MS + 500,
    });
    expect(result.current.userId).toBe("user-1");
    expect(result.current.sortBy).toBe("new");
  }, 10_000);

  it("fetchImmediately bypasses the debounce even with filters/sort set", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
    const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
      projectId: "test-project",
    });

    await act(async () => {
      result.current.fetchEntities(
        { userId: "user-1" },
        { sortBy: "new" },
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
        { sortBy: "new" },
        undefined,
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2));
    expect(result.current.userId).toBe("user-1");
    expect(result.current.sortBy).toBe("new");

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

    it("deleteEntity removes the entity from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "e1" }], false));
      const { result } = renderHookWithStore(() => useEntityList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchEntities({}));
      await waitFor(() => expect(result.current.entities).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(
        new Response("OK", { status: 200, headers: { "content-type": "text/plain" } }),
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
    // No space filter: absent, or the explicit `null` the list sends (the
    // server treats `spaceId=null` as unfiltered).
    expect(first.get("spaceId")).toBe("s1");
    expect(second.get("spaceId") ?? "null").toBe("null");
    expect(third.get("page")).toBe("2");
    expect(third.get("spaceId") ?? "null").toBe("null");
  });

  it("an omitted spaceReputationId isn't kept for loadMore", async () => {
    const [first, , third] = await fetchTwiceThenLoadMore(
      { spaceReputationId: "context", spaceReputationDescendants: true },
      {},
    );
    expect(first.get("spaceReputationId")).toBe("context");
    expect(third.has("spaceReputationId")).toBe(false);
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

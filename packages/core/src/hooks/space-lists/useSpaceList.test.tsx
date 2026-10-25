import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import useSpaceList from "./useSpaceList";

let fetchHandle: FetchMockHandle;

const DEBOUNCE_MS = 800;

function paginated(data: { id: string }[], hasMore: boolean) {
  return jsonResponse({
    data,
    pagination: { page: 1, pageSize: 20, totalPages: hasMore ? 2 : 1, totalItems: data.length, hasMore },
  });
}

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useSpaceList", () => {
  it("fetches immediately when called with no filters", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], true));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchSpaces({}));

    await waitFor(() => expect(result.current.spaces.map((s) => s.id)).toEqual(["s1"]));
    expect(result.current.hasMore).toBe(true);
    expect(result.current.sortBy).toBe("createdAt"); // default
  });

  // Real timers only — see [[sdk-testing-fake-timers-corrupt-scheduler]] memory:
  // vi.useFakeTimers() has been observed to corrupt React's scheduler across later
  // tests in the same file when combined with @testing-library/react hook renders.
  it("debounces a fetch triggered by a filter change", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], false));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchSpaces({ query: "foo" }));
    expect(fetchHandle.calls()).toHaveLength(0); // not yet — debounced

    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1), {
      timeout: DEBOUNCE_MS + 500,
    });
    expect(result.current.query).toBe("foo");
  }, 10_000);

  it("fetchImmediately bypasses the debounce even with filters set", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], false));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });

    await act(async () => {
      result.current.fetchSpaces({ query: "foo" }, undefined, { fetchImmediately: true });
      await Promise.resolve();
    });

    expect(fetchHandle.calls()).toHaveLength(1);
  });

  it("clearImmediately empties spaces synchronously before the (debounced) fetch resolves", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], false));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchSpaces({}, undefined, { fetchImmediately: true }));
    await waitFor(() => expect(result.current.spaces).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s2" }], false));
    act(() =>
      result.current.fetchSpaces({ query: "bar" }, undefined, { clearImmediately: true }),
    );
    expect(result.current.spaces).toEqual([]); // cleared synchronously, before the debounce fires

    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(2), {
      timeout: DEBOUNCE_MS + 500,
    });
  }, 10_000);

  it("resetUnspecified resets filters when fetching immediately", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });
    act(() =>
      result.current.fetchSpaces({ query: "foo" }, undefined, { fetchImmediately: true }),
    );
    await waitFor(() => expect(result.current.query).toBe("foo"));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
    act(() =>
      result.current.fetchSpaces({}, undefined, {
        fetchImmediately: true,
        resetUnspecified: true,
      }),
    );
    await waitFor(() => expect(result.current.query).toBeNull());
  });

  it("sends sortBy and sortDir, keeps them for loadMore, and resets sortDir", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], true));
    const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
      projectId: "test-project",
    });
    expect(result.current.sortDir).toBeNull();

    act(() =>
      result.current.fetchSpaces(
        { sortBy: "alphabetical", sortDir: "desc" },
        undefined,
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(result.current.spaces).toHaveLength(1));
    expect(result.current.sortDir).toBe("desc");
    const first = new URL(fetchHandle.calls()[0].url);
    expect(first.searchParams.get("sortBy")).toBe("alphabetical");
    expect(first.searchParams.get("sortDir")).toBe("desc");

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s2" }], false));
    await act(async () => {
      await result.current.loadMore();
    });
    const page2 = fetchHandle
      .calls()
      .map((c) => new URL(c.url))
      .find((u) => u.searchParams.get("page") === "2")!;
    expect(page2.searchParams.get("sortDir")).toBe("desc");

    // Left out (null): no sortDir is sent, so the server uses the sort's
    // natural direction.
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s3" }], false));
    act(() =>
      result.current.fetchSpaces({}, undefined, {
        fetchImmediately: true,
        resetUnspecified: true,
      }),
    );
    await waitFor(() => expect(result.current.spaces.map((s) => s.id)).toEqual(["s3"]));
    expect(result.current.sortDir).toBeNull();
    const last = new URL(fetchHandle.calls()[fetchHandle.calls().length - 1].url);
    expect(last.searchParams.get("sortDir")).toBeNull();
  });

  describe("parentSpaceId", () => {
    it("lists top-level spaces by default and keeps that filter on page 2 and after a re-sort", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], true));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });
      expect(result.current.parentSpaceId).toBe("none");

      act(() => result.current.fetchSpaces({}));
      await waitFor(() => expect(result.current.spaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s2" }], false));
      await act(async () => {
        await result.current.loadMore();
      });
      await waitFor(() => expect(result.current.spaces).toHaveLength(2));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s3" }], false));
      act(() =>
        result.current.fetchSpaces({ sortBy: "alphabetical" }, undefined, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.spaces.map((s) => s.id)).toEqual(["s3"]));

      const urls = fetchHandle.calls().map((c) => new URL(c.url));
      expect(urls).toHaveLength(3);
      expect(urls[1].searchParams.get("page")).toBe("2");
      for (const url of urls) {
        expect(url.searchParams.get("parentSpaceId")).toBe("none");
      }
      expect(result.current.parentSpaceId).toBe("none");
    });

    it("sends a parent id on every page, and null puts the default back", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], true));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });

      act(() =>
        result.current.fetchSpaces({ parentSpaceId: "p1" }, undefined, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.spaces).toHaveLength(1));
      expect(result.current.parentSpaceId).toBe("p1");

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s2" }], false));
      await act(async () => {
        await result.current.loadMore();
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s3" }], false));
      act(() =>
        result.current.fetchSpaces({ parentSpaceId: null }, undefined, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.spaces.map((s) => s.id)).toEqual(["s3"]));

      const sent = fetchHandle.calls().map((c) => new URL(c.url).searchParams.get("parentSpaceId"));
      expect(sent).toEqual(["p1", "p1", "none"]);
      expect(result.current.parentSpaceId).toBe("none");
    });
  });

  describe("loadMore", () => {
    it("is a no-op before fetchSpaces has been called (no config yet)", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.loadMore();
      });

      expect(fetchHandle.calls()).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it("fetches the next page and appends, once initialized", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], true));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchSpaces({}));
      await waitFor(() => expect(result.current.spaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s2" }], false));
      await act(async () => {
        await result.current.loadMore();
      });

      expect(result.current.spaces.map((s) => s.id)).toEqual(["s1", "s2"]);
      expect(result.current.hasMore).toBe(false);

      const pageCall = fetchHandle
        .calls()
        .find((c) => new URL(c.url).searchParams.get("page") === "2");
      expect(pageCall).toBeTruthy();
    });

    it("is a no-op once hasMore is false", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], false));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchSpaces({}));
      await waitFor(() => expect(result.current.spaces).toHaveLength(1));
      expect(result.current.hasMore).toBe(false);

      await act(async () => {
        await result.current.loadMore();
      });
      expect(fetchHandle.calls()).toHaveLength(1); // unchanged
    });
  });

  describe("createSpace / deleteSpace", () => {
    it("createSpace adds the new space to the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchSpaces({}, undefined, { fetchImmediately: true }));
      await waitFor(() => expect(result.current.hasMore).toBe(false));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s1" }, 201));
      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createSpace({ name: "Hello" });
      });

      expect(created?.id).toBe("s1");
      expect(result.current.spaces.map((s) => s.id)).toEqual(["s1"]);
    });

    it("deleteSpace removes the space from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "s1" }], false));
      const { result } = renderHookWithStore(() => useSpaceList({ listId: "feed" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchSpaces({}));
      await waitFor(() => expect(result.current.spaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
      await act(async () => {
        await result.current.deleteSpace({ spaceId: "s1" });
      });

      expect(result.current.spaces).toEqual([]);
    });
  });
});

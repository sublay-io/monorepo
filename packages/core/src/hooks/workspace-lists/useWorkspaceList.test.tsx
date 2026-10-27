import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import useWorkspaceList from "./useWorkspaceList";

let fetchHandle: FetchMockHandle;

const DEBOUNCE_MS = 800;

function paginated(data: object[], hasMore: boolean) {
  return jsonResponse({
    data,
    pagination: { page: 1, pageSize: 20, totalPages: hasMore ? 2 : 1, totalItems: data.length, hasMore },
  });
}

const listUrls = () =>
  fetchHandle
    .calls()
    .filter((c) => c.method === "GET")
    .map((c) => new URL(c.url))
    .filter((u) => /\/workspaces$/.test(u.pathname));

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useWorkspaceList", () => {
  it("fetches immediately with the defaults: reachable, every level, newest first", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      paginated([{ id: "w1", reasons: [{ type: "member" }] }], true),
    );
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });
    expect(result.current.relation).toBe("reachable");
    expect(result.current.parentWorkspaceId).toBe("any");
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.include).toBeNull();

    act(() => result.current.fetchWorkspaces({}));

    await waitFor(() => expect(result.current.workspaces.map((w) => w.id)).toEqual(["w1"]));
    expect(result.current.workspaces[0].reasons).toEqual([{ type: "member" }]);
    expect(result.current.hasMore).toBe(true);

    const [url] = listUrls();
    expect(url.searchParams.get("relation")).toBe("reachable");
    expect(url.searchParams.get("parentWorkspaceId")).toBe("any");
    expect(url.searchParams.get("sortDir")).toBe("desc");
    expect(url.searchParams.get("limit")).toBe("20");
    expect(url.searchParams.has("include")).toBe(false);
  });

  // Real timers only — see the [[sdk-testing-fake-timers-corrupt-scheduler]] memory.
  it("debounces a fetch triggered by a filter change", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }], false));
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchWorkspaces({ relation: "direct" }));
    expect(fetchHandle.calls()).toHaveLength(0);

    await waitFor(() => expect(fetchHandle.calls()).toHaveLength(1), {
      timeout: DEBOUNCE_MS + 500,
    });
    expect(result.current.relation).toBe("direct");
  }, 10_000);

  it("fetchImmediately bypasses the debounce, and cancels a pending debounced fetch", async () => {
    fetchHandle.fetchMock.mockResolvedValue(paginated([{ id: "w1" }], false));
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });

    act(() => result.current.fetchWorkspaces({ sortDir: "asc" }));
    await act(async () => {
      result.current.fetchWorkspaces({ relation: "direct" }, undefined, { fetchImmediately: true });
      await Promise.resolve();
    });
    expect(fetchHandle.calls()).toHaveLength(1);

    await new Promise((r) => setTimeout(r, DEBOUNCE_MS + 200));
    expect(fetchHandle.calls()).toHaveLength(1);
  }, 10_000);

  it("the workspace switcher: direct, every level, oldest first, with member counts, on every page", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "parent" }], true));
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });

    act(() =>
      result.current.fetchWorkspaces(
        { relation: "direct", parentWorkspaceId: "any", sortDir: "asc", include: ["memberCount"] },
        { limit: 50 },
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(result.current.workspaces).toHaveLength(1));
    expect(result.current.include).toEqual(["memberCount"]);

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "child" }], false));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.workspaces.map((w) => w.id)).toEqual(["parent", "child"]);
    expect(result.current.hasMore).toBe(false);

    const urls = listUrls();
    expect(urls).toHaveLength(2);
    expect(urls[1].searchParams.get("page")).toBe("2");
    for (const url of urls) {
      expect(url.searchParams.get("relation")).toBe("direct");
      expect(url.searchParams.get("parentWorkspaceId")).toBe("any");
      expect(url.searchParams.get("sortDir")).toBe("asc");
      expect(url.searchParams.get("include")).toBe("memberCount");
      expect(url.searchParams.get("limit")).toBe("50");
    }
  });

  it("null puts a filter back to its default; resetUnspecified resets the rest", async () => {
    fetchHandle.fetchMock.mockResolvedValue(paginated([], false));
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });

    act(() =>
      result.current.fetchWorkspaces(
        { relation: "direct", parentWorkspaceId: "p1", sortDir: "asc", include: "memberCount" },
        undefined,
        { fetchImmediately: true },
      ),
    );
    await waitFor(() => expect(result.current.parentWorkspaceId).toBe("p1"));

    act(() =>
      result.current.fetchWorkspaces({ parentWorkspaceId: null, sortDir: null }, undefined, {
        fetchImmediately: true,
      }),
    );
    await waitFor(() => expect(listUrls()).toHaveLength(2));
    expect(result.current.parentWorkspaceId).toBe("any");
    expect(result.current.sortDir).toBe("desc");
    expect(result.current.relation).toBe("direct");
    const second = listUrls()[1].searchParams;
    expect(second.get("parentWorkspaceId")).toBe("any");
    expect(second.get("sortDir")).toBe("desc");
    expect(second.get("relation")).toBe("direct");
    expect(second.get("include")).toBe("memberCount");

    act(() =>
      result.current.fetchWorkspaces({}, undefined, { fetchImmediately: true, resetUnspecified: true }),
    );
    await waitFor(() => expect(listUrls()).toHaveLength(3));
    expect(result.current.relation).toBe("reachable");
    expect(result.current.include).toBeNull();
    const third = listUrls()[2].searchParams;
    expect(third.get("relation")).toBe("reachable");
    expect(third.has("include")).toBe(false);
  });

  it("clearImmediately empties the list synchronously", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }], false));
    const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
      projectId: "test-project",
    });
    act(() => result.current.fetchWorkspaces({}));
    await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w2" }], false));
    act(() =>
      result.current.fetchWorkspaces({ relation: "direct" }, undefined, { clearImmediately: true }),
    );
    expect(result.current.workspaces).toEqual([]);

    await waitFor(() => expect(result.current.workspaces.map((w) => w.id)).toEqual(["w2"]), {
      timeout: DEBOUNCE_MS + 500,
    });
  }, 10_000);

  it("two hooks with the same listId share one list", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }], false));
    const { result } = renderHookWithStore(
      () => ({ a: useWorkspaceList({ listId: "ws" }), b: useWorkspaceList({ listId: "ws" }) }),
      { projectId: "test-project" },
    );

    act(() => result.current.a.fetchWorkspaces({}));
    await waitFor(() => expect(result.current.b.workspaces.map((w) => w.id)).toEqual(["w1"]));
  });

  describe("loadMore / refetch", () => {
    it("loadMore and refetch are no-ops before fetchWorkspaces", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.loadMore();
        result.current.refetch();
      });

      expect(fetchHandle.calls()).toHaveLength(0);
      consoleSpy.mockRestore();
    });

    it("loadMore is a no-op once hasMore is false", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }], false));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchWorkspaces({}));
      await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

      await act(async () => {
        await result.current.loadMore();
      });
      expect(fetchHandle.calls()).toHaveLength(1);
    });

    it("refetch reloads page 1 with the current filters and page size", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }], true));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() =>
        result.current.fetchWorkspaces({ relation: "direct" }, { limit: 5 }, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }, { id: "w2" }], false));
      act(() => result.current.refetch());
      await waitFor(() => expect(result.current.workspaces.map((w) => w.id)).toEqual(["w1", "w2"]));

      const last = listUrls()[1].searchParams;
      expect(last.get("page")).toBe("1");
      expect(last.get("limit")).toBe("5");
      expect(last.get("relation")).toBe("direct");
    });
  });

  describe("createWorkspace / deleteWorkspace", () => {
    it("createWorkspace reads the new workspace back with the list's include and puts it first", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "old" }], false));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() =>
        result.current.fetchWorkspaces({ include: "memberCount" }, undefined, { fetchImmediately: true }),
      );
      await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "new", parentWorkspaceId: null }, 201));
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ id: "new", parentWorkspaceId: null, reasons: [{ type: "owner" }], memberCount: 0 }),
      );
      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createWorkspace({ name: "New" });
      });

      expect(created?.id).toBe("new");
      expect(result.current.workspaces.map((w) => w.id)).toEqual(["new", "old"]);
      expect(result.current.workspaces[0].reasons).toEqual([{ type: "owner" }]);
      const readBack = new URL(fetchHandle.calls()[2].url);
      expect(readBack.pathname).toContain("/workspaces/new");
      expect(readBack.searchParams.get("include")).toBe("memberCount");
    });

    it("createWorkspace puts it last under asc once every page is loaded", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "old" }], false));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchWorkspaces({ sortDir: "asc" }, undefined, { fetchImmediately: true }));
      await waitFor(() => expect(result.current.workspaces).toHaveLength(1));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "new", parentWorkspaceId: null }, 201));
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "new", parentWorkspaceId: null, reasons: [] }));
      await act(async () => {
        await result.current.createWorkspace({ name: "New" });
      });

      expect(result.current.workspaces.map((w) => w.id)).toEqual(["old", "new"]);
    });

    it("createWorkspace resolves undefined instead of throwing on a failed create", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([], false));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchWorkspaces({}));
      await waitFor(() => expect(result.current.hasMore).toBe(false));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      let created: unknown = "unset";
      await act(async () => {
        created = await result.current.createWorkspace({ name: "New" });
      });
      expect(created).toBeUndefined();
      expect(result.current.workspaces).toEqual([]);
    });

    it("deleteWorkspace removes the workspace from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(paginated([{ id: "w1" }, { id: "w2" }], false));
      const { result } = renderHookWithStore(() => useWorkspaceList({ listId: "ws" }), {
        projectId: "test-project",
      });
      act(() => result.current.fetchWorkspaces({}));
      await waitFor(() => expect(result.current.workspaces).toHaveLength(2));

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "deleted" }));
      await act(async () => {
        await result.current.deleteWorkspace({ workspaceId: "w1" });
      });

      expect(result.current.workspaces.map((w) => w.id)).toEqual(["w2"]);
    });
  });
});

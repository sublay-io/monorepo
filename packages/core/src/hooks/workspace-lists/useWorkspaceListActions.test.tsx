import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useWorkspaceListActions } from "./useWorkspaceListActions";
import {
  initializeList,
  updateFilters,
  setWorkspaceListHasMore,
  selectWorkspaceListWorkspaces,
  selectWorkspaceListLoading,
  selectWorkspaceListHasMore,
  selectWorkspaceList,
} from "../../store/slices/workspaceListsSlice";

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

const page = (data: object[], hasMore: boolean) =>
  jsonResponse({
    data,
    pagination: { page: 1, pageSize: 20, totalPages: hasMore ? 2 : 1, totalItems: data.length, hasMore },
  });

describe("useWorkspaceListActions", () => {
  describe("fetchWorkspaces", () => {
    it("stores the result, replacing on page 1, and sends the filters", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(page([{ id: "w1" }], true));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.fetchWorkspaces("feed", {
          page: 1,
          limit: 20,
          relation: "direct",
          parentWorkspaceId: "any",
          sortDir: "asc",
        });
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed").map((w) => w.id)).toEqual(["w1"]);
      expect(selectWorkspaceListHasMore(store.getState(), "feed")).toBe(true);
      expect(selectWorkspaceListLoading(store.getState(), "feed")).toBe(false);

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.pathname).toContain("/test-project/workspaces");
      expect(url.searchParams.get("relation")).toBe("direct");
      expect(url.searchParams.get("parentWorkspaceId")).toBe("any");
      expect(url.searchParams.get("sortDir")).toBe("asc");
    });

    it("appends on page > 1", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(page([{ id: "w1" }], true));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      await act(async () => {
        await result.current.fetchWorkspaces("feed", { page: 1, limit: 1 });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(page([{ id: "w2" }], false));
      await act(async () => {
        await result.current.fetchWorkspaces("feed", { page: 2, limit: 1 });
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed").map((w) => w.id)).toEqual(["w1", "w2"]);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useWorkspaceListActions(), { projectId: "" });
      await expect(
        result.current.fetchWorkspaces("feed", { page: 1, limit: 20 }),
      ).rejects.toThrow("No project ID available");
    });

    it("records the error and re-throws on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(
          result.current.fetchWorkspaces("feed", { page: 1, limit: 20 }),
        ).rejects.toBeTruthy();
      });

      expect(selectWorkspaceList(store.getState(), "feed")?.error).toBe("Failed to fetch workspaces");
      expect(selectWorkspaceListLoading(store.getState(), "feed")).toBe(false);
    });
  });

  describe("createWorkspace", () => {
    it("creates, reads the workspace back for its reasons, and puts it first", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "w1", name: "Acme", parentWorkspaceId: null }, 201));
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ id: "w1", name: "Acme", parentWorkspaceId: null, reasons: [{ type: "owner" }], memberCount: 1 }),
      );
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      let created: { id: string; reasons?: unknown } | undefined;
      await act(async () => {
        created = await result.current.createWorkspace("feed", { name: "Acme", include: ["memberCount"] });
      });

      expect(created?.reasons).toEqual([{ type: "owner" }]);
      const rows = selectWorkspaceListWorkspaces(store.getState(), "feed");
      expect(rows.map((w) => w.id)).toEqual(["w1"]);
      expect(rows[0].reasons).toEqual([{ type: "owner" }]);

      const [post, get] = fetchHandle.calls();
      expect(post.method).toBe("POST");
      const readBack = new URL(get.url);
      expect(readBack.pathname).toContain("/test-project/workspaces/w1");
      expect(readBack.searchParams.get("include")).toBe("memberCount");
    });

    it("adds the row from the create when the read-back fails", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "w1", name: "Acme", parentWorkspaceId: null }, 201));
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await result.current.createWorkspace("feed", { name: "Acme" });
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed").map((w) => w.id)).toEqual(["w1"]);
      consoleSpy.mockRestore();
    });

    it("leaves the row out when it doesn't match the list's parent filter", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "child", parentWorkspaceId: "p1" }, 201));
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "child", parentWorkspaceId: "p1", reasons: [] }));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      act(() => {
        store.dispatch(updateFilters({ listId: "feed", filters: { parentWorkspaceId: "none" } }));
        store.dispatch(setWorkspaceListHasMore({ listId: "feed", hasMore: false }));
      });

      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createWorkspace("feed", { name: "Child", parentWorkspaceId: "p1" });
      });

      expect(created?.id).toBe("child");
      expect(selectWorkspaceListWorkspaces(store.getState(), "feed")).toEqual([]);
    });

    it("throws without a projectId or a name", async () => {
      const noProject = renderHookWithStore(() => useWorkspaceListActions(), { projectId: "" });
      await expect(noProject.result.current.createWorkspace("feed", { name: "Acme" })).rejects.toThrow(
        "No project ID available",
      );

      const noName = renderHookWithStore(() => useWorkspaceListActions(), { projectId: "test-project" });
      await expect(noName.result.current.createWorkspace("feed", { name: "" })).rejects.toThrow(
        "Workspace name is required",
      );
    });

    it("re-throws on a failed create without mutating the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(result.current.createWorkspace("feed", { name: "Acme" })).rejects.toBeTruthy();
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed")).toEqual([]);
    });
  });

  describe("deleteWorkspace", () => {
    it("deletes and removes the workspace from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(page([{ id: "w1" }], false));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      await act(async () => {
        await result.current.fetchWorkspaces("feed", { page: 1, limit: 20 });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "deleted" }));
      await act(async () => {
        await result.current.deleteWorkspace("feed", { workspaceId: "w1" });
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed")).toEqual([]);
    });

    it("throws without a projectId or a workspaceId", async () => {
      const noProject = renderHookWithStore(() => useWorkspaceListActions(), { projectId: "" });
      await expect(noProject.result.current.deleteWorkspace("feed", { workspaceId: "w1" })).rejects.toThrow(
        "No project ID available",
      );

      const noId = renderHookWithStore(() => useWorkspaceListActions(), { projectId: "test-project" });
      await expect(noId.result.current.deleteWorkspace("feed", { workspaceId: "" })).rejects.toThrow(
        "Workspace ID is required",
      );
    });

    it("re-throws and leaves the list untouched on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(page([{ id: "w1" }], false));
      const { result, store } = renderHookWithStore(() => useWorkspaceListActions(), {
        projectId: "test-project",
      });
      await act(async () => {
        await result.current.fetchWorkspaces("feed", { page: 1, limit: 20 });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      await act(async () => {
        await expect(result.current.deleteWorkspace("feed", { workspaceId: "w1" })).rejects.toBeTruthy();
      });

      expect(selectWorkspaceListWorkspaces(store.getState(), "feed").map((w) => w.id)).toEqual(["w1"]);
    });
  });
});

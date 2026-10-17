import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useSpaceListActions } from "./useSpaceListActions";
import {
  initializeList,
  selectSpaceListSpaces,
  selectSpaceListLoading,
  selectSpaceListHasMore,
  selectSpaceList,
} from "../../store/slices/spaceListsSlice";

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useSpaceListActions", () => {
  describe("fetchSpaces", () => {
    it("stores the result, replacing spaces on page 1", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "s1" }],
          pagination: { page: 1, pageSize: 20, totalPages: 2, totalItems: 21, hasMore: true },
        }),
      );
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.fetchSpaces("feed", { page: 1, sortBy: "createdAt", limit: 20 });
      });

      expect(selectSpaceListSpaces(store.getState(), "feed").map((s) => s.id)).toEqual(["s1"]);
      expect(selectSpaceListHasMore(store.getState(), "feed")).toBe(true);
      expect(selectSpaceListLoading(store.getState(), "feed")).toBe(false);

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.pathname).toContain("/test-project/spaces");
      expect(url.searchParams.get("sortBy")).toBe("createdAt");
    });

    it("appends on page > 1", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "s1" }],
          pagination: { page: 1, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: true },
        }),
      );
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      await act(async () => {
        await result.current.fetchSpaces("feed", { page: 1, sortBy: "createdAt", limit: 1 });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "s2" }],
          pagination: { page: 2, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: false },
        }),
      );
      await act(async () => {
        await result.current.fetchSpaces("feed", { page: 2, sortBy: "createdAt", limit: 1 });
      });

      expect(
        selectSpaceListSpaces(store.getState(), "feed").map((s) => s.id),
      ).toEqual(["s1", "s2"]);
    });

    it("returns null and warns without fetching when sortBy is missing", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchSpaces("feed", {
          page: 1,
          sortBy: undefined as never,
          limit: 20,
        });
      });

      expect(returned).toBeNull();
      expect(fetchHandle.calls()).toHaveLength(0);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), { projectId: "" });

      await expect(
        result.current.fetchSpaces("feed", { page: 1, sortBy: "createdAt", limit: 20 }),
      ).rejects.toThrow("No project ID available");
    });

    it("records the error and re-throws on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(
          result.current.fetchSpaces("feed", { page: 1, sortBy: "createdAt", limit: 20 }),
        ).rejects.toBeTruthy();
      });

      expect(selectSpaceList(store.getState(), "feed")?.error).toBe("Failed to fetch spaces");
      expect(selectSpaceListLoading(store.getState(), "feed")).toBe(false);
    });
  });

  describe("createSpace", () => {
    it("creates and prepends the space to the list by default", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s1", name: "Hello" }, 201));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createSpace("feed", { name: "Hello" });
      });

      expect(created?.id).toBe("s1");
      expect(selectSpaceListSpaces(store.getState(), "feed").map((s) => s.id)).toEqual(["s1"]);
    });

    it("inserts last when requested", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s1" }, 201));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createSpace("feed", { name: "First" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s2" }, 201));
      await act(async () => {
        await result.current.createSpace("feed", { name: "Second", insertPosition: "last" });
      });

      expect(
        selectSpaceListSpaces(store.getState(), "feed").map((s) => s.id),
      ).toEqual(["s1", "s2"]);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), { projectId: "" });

      await expect(result.current.createSpace("feed", { name: "Hello" })).rejects.toThrow(
        "No project ID available",
      );
    });

    it("throws when name is missing", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });

      await expect(
        result.current.createSpace("feed", { name: "" }),
      ).rejects.toThrow("Space name is required");
    });

    it("re-throws on a failed request without mutating the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(
          result.current.createSpace("feed", { name: "Hello" }),
        ).rejects.toBeTruthy();
      });

      expect(selectSpaceListSpaces(store.getState(), "feed")).toEqual([]);
    });
  });

  describe("deleteSpace", () => {
    it("deletes and removes the space from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s1" }, 201));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createSpace("feed", { name: "Hello" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ success: true }));
      await act(async () => {
        await result.current.deleteSpace("feed", { spaceId: "s1" });
      });

      expect(selectSpaceListSpaces(store.getState(), "feed")).toEqual([]);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), { projectId: "" });

      await expect(result.current.deleteSpace("feed", { spaceId: "s1" })).rejects.toThrow(
        "No project ID available",
      );
    });

    it("throws when spaceId is missing", async () => {
      const { result } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });

      await expect(
        result.current.deleteSpace("feed", { spaceId: "" }),
      ).rejects.toThrow("Space ID is required");
    });

    it("re-throws and leaves the list untouched on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "s1" }, 201));
      const { result, store } = renderHookWithStore(() => useSpaceListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createSpace("feed", { name: "Hello" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      await act(async () => {
        await expect(
          result.current.deleteSpace("feed", { spaceId: "s1" }),
        ).rejects.toBeTruthy();
      });

      expect(selectSpaceListSpaces(store.getState(), "feed").map((s) => s.id)).toEqual(["s1"]);
    });
  });
});

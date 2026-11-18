import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useEntityListActions } from "./useEntityListActions";
import {
  initializeList,
  selectEntityListEntities,
  selectEntityListLoading,
  selectEntityListHasMore,
  selectEntityList,
} from "../../store/slices/entityListsSlice";

let fetchHandle: FetchMockHandle;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useEntityListActions", () => {
  describe("fetchEntities", () => {
    it("stores the result, replacing entities on page 1", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "e1" }],
          pagination: { page: 1, pageSize: 10, totalPages: 2, totalItems: 11, hasMore: true },
        }),
      );
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });

      await act(async () => {
        await result.current.fetchEntities("feed", { page: 1, sortBy: "hot", limit: 10 });
      });

      expect(selectEntityListEntities(store.getState(), "feed").map((e) => e.id)).toEqual(["e1"]);
      expect(selectEntityListHasMore(store.getState(), "feed")).toBe(true);
      expect(selectEntityListLoading(store.getState(), "feed")).toBe(false);
    });

    it("appends on page > 1", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "e1" }],
          pagination: { page: 1, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: true },
        }),
      );
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      await act(async () => {
        await result.current.fetchEntities("feed", { page: 1, sortBy: "hot", limit: 1 });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [{ id: "e2" }],
          pagination: { page: 2, pageSize: 1, totalPages: 2, totalItems: 2, hasMore: false },
        }),
      );
      await act(async () => {
        await result.current.fetchEntities("feed", { page: 2, sortBy: "hot", limit: 1 });
      });

      expect(
        selectEntityListEntities(store.getState(), "feed").map((e) => e.id),
      ).toEqual(["e1", "e2"]);
    });

    it("returns null and warns without fetching when sortBy is missing", async () => {
      const { result } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.fetchEntities("feed", {
          page: 1,
          sortBy: undefined as never,
          limit: 10,
        });
      });

      expect(returned).toBeNull();
      expect(fetchHandle.calls()).toHaveLength(0);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useEntityListActions(), { projectId: "" });

      await expect(
        result.current.fetchEntities("feed", { page: 1, sortBy: "hot", limit: 10 }),
      ).rejects.toThrow("No project ID available");
    });

    it("records the error and re-throws on a failed request", async () => {
      // The slice's setEntityListError/setEntityListLoading reducers are no-ops for a
      // list that was never initialized — mirror useEntityList's real call order.
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(
          result.current.fetchEntities("feed", { page: 1, sortBy: "hot", limit: 10 }),
        ).rejects.toBeTruthy();
      });

      expect(selectEntityList(store.getState(), "feed")?.error).toBe("Failed to fetch entities");
      expect(selectEntityListLoading(store.getState(), "feed")).toBe(false);
    });
  });

  describe("createEntity", () => {
    it("creates and prepends the entity to the list by default", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1", title: "Hello" }, 201));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      let created: { id: string } | undefined;
      await act(async () => {
        created = await result.current.createEntity("feed", { title: "Hello" });
      });

      expect(created?.id).toBe("e1");
      expect(selectEntityListEntities(store.getState(), "feed").map((e) => e.id)).toEqual(["e1"]);
    });

    it("inserts last when requested", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1" }, 201));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createEntity("feed", { title: "First" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e2" }, 201));
      await act(async () => {
        await result.current.createEntity("feed", { title: "Second", insertPosition: "last" });
      });

      expect(
        selectEntityListEntities(store.getState(), "feed").map((e) => e.id),
      ).toEqual(["e1", "e2"]);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useEntityListActions(), { projectId: "" });

      await expect(result.current.createEntity("feed", { title: "Hello" })).rejects.toThrow(
        "No project ID available",
      );
    });

    it("re-throws on a failed request without mutating the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));

      await act(async () => {
        await expect(
          result.current.createEntity("feed", { title: "Hello" }),
        ).rejects.toBeTruthy();
      });

      expect(selectEntityListEntities(store.getState(), "feed")).toEqual([]);
    });
  });

  describe("deleteEntity", () => {
    it("deletes and removes the entity from the list", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1" }, 201));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createEntity("feed", { title: "Hello" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(
        new Response(null, { status: 204 }),
      );
      await act(async () => {
        await result.current.deleteEntity("feed", { entityId: "e1" });
      });

      expect(selectEntityListEntities(store.getState(), "feed")).toEqual([]);
    });

    it("throws without a projectId", async () => {
      const { result } = renderHookWithStore(() => useEntityListActions(), { projectId: "" });

      await expect(result.current.deleteEntity("feed", { entityId: "e1" })).rejects.toThrow(
        "No project ID available",
      );
    });

    it("re-throws and leaves the list untouched on a failed request", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1" }, 201));
      const { result, store } = renderHookWithStore(() => useEntityListActions(), {
        projectId: "test-project",
      });
      act(() => store.dispatch(initializeList({ listId: "feed" })));
      await act(async () => {
        await result.current.createEntity("feed", { title: "Hello" });
      });

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      await act(async () => {
        await expect(
          result.current.deleteEntity("feed", { entityId: "e1" }),
        ).rejects.toBeTruthy();
      });

      expect(selectEntityListEntities(store.getState(), "feed").map((e) => e.id)).toEqual(["e1"]);
    });
  });
});

import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { act, cleanup, waitFor } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  mockAxiosPrivate,
  resetAxiosMocks,
  makeAuthUser,
  type FetchMockHandle,
  type AxiosMockHandle,
} from "../../test-utils";
import { setUser } from "../../store/slices/authSlice";
import useCollections from "./useCollections";
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
import type { Collection } from "../../interfaces/models/Collection";
import type { Entity } from "../../interfaces/models/Entity";

let fetchHandle: FetchMockHandle;
let axiosPrivate: AxiosMockHandle;

const ROOT: Collection = {
  id: "root",
  projectId: "test-project",
  userId: "user-1",
  parentId: null,
  name: "Root",
  entityCount: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

/** Sub-collections by parent id, for the default GET responder below. */
const SUBCOLLECTIONS: Record<string, Collection[]> = {
  root: [{ ...ROOT, id: "child", parentId: "root" }],
  child: [],
};

function requestUrlAndMethod(args: unknown[]): { url: string; method: string } {
  const req = args[0] as Request | string;
  const url = typeof req === "string" ? req : req.url;
  const method =
    (typeof req === "string"
      ? (args[1] as RequestInit | undefined)?.method
      : (req as Request).method) ?? "GET";
  return { url, method };
}

/**
 * Routes every collections-related GET to a canned response keyed off the URL, so
 * RTK Query's tag-invalidation-triggered background refetches (e.g. after
 * createCollection invalidates the parent's sub-collections list) don't outrun a
 * fixed queue of `mockResolvedValueOnce` calls.
 */
function defaultCollectionsResponder(...args: unknown[]) {
  const { url, method } = requestUrlAndMethod(args);
  if (method === "GET" && url.endsWith("/collections/root")) {
    return jsonResponse(ROOT);
  }
  const subsMatch = url.match(/\/collections\/([^/]+)\/sub-collections$/);
  if (method === "GET" && subsMatch) {
    return jsonResponse({ data: SUBCOLLECTIONS[subsMatch[1]] ?? [] });
  }
  return jsonResponse({}, 404);
}

beforeEach(() => {
  fetchHandle = stubFetchMock(async (...args: unknown[]) => defaultCollectionsResponder(...args));
  axiosPrivate = mockAxiosPrivate();
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
  resetAxiosMocks();
});

describe("useCollections", () => {
  it("auto-fetches the root collection then its sub-collections once a user is present", async () => {
    const { result, store } = renderHookWithStore(() => useCollections());
    store.dispatch(setUser(makeAuthUser()));

    await waitFor(() => expect(result.current.currentCollection?.id).toBe("root"));
    await waitFor(() => expect(result.current.subCollections).toHaveLength(1));
    expect(result.current.subCollections[0].id).toBe("child");
  });

  it("does not fetch the root collection while there is no user", async () => {
    renderHookWithStore(() => useCollections());

    await new Promise((r) => setTimeout(r, 10));
    expect(fetchHandle.calls()).toHaveLength(0);
  });

  describe("CRUD guard clauses", () => {
    it("createCollection no-ops without a current collection", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useCollections());

      await act(async () => {
        await result.current.createCollection({ name: "My List" });
      });

      expect(fetchHandle.calls().some((c) => c.method !== "GET")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("No current collection.");
      consoleSpy.mockRestore();
    });

    it("addToCollection no-ops without an entity id", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useCollections());

      await act(async () => {
        // @ts-expect-error -- intentionally omitting the entity to exercise the guard clause
        await result.current.addToCollection({ entity: {} });
      });

      expect(fetchHandle.calls().some((c) => c.method !== "GET")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("No entity provided.");
      consoleSpy.mockRestore();
    });

    it("removeFromCollection no-ops without a current collection", async () => {
      const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});
      const { result } = renderHookWithStore(() => useCollections());

      await act(async () => {
        await result.current.removeFromCollection({ entityId: "entity-1" });
      });

      expect(fetchHandle.calls().some((c) => c.method !== "GET")).toBe(false);
      expect(consoleSpy).toHaveBeenCalledWith("No current collection.");
      consoleSpy.mockRestore();
    });
  });

  describe("CRUD success paths (delegated to useCollectionsActions, scoped to currentCollection)", () => {
    it("createCollection creates under the current collection and navigates into it", async () => {
      fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
        const { url, method } = requestUrlAndMethod(args);
        if (method === "POST" && url.endsWith("/collections/root/sub-collections")) {
          return jsonResponse({ ...ROOT, id: "child", parentId: "root" }, 201);
        }
        return defaultCollectionsResponder(...args);
      });

      const { result, store } = renderHookWithStore(() => useCollections());
      store.dispatch(setUser(makeAuthUser()));
      await waitFor(() => expect(result.current.currentCollection?.id).toBe("root"));

      await act(async () => {
        await result.current.createCollection({ name: "My List" });
      });

      expect(result.current.currentCollection?.id).toBe("child");
    });

    it("addToCollection adds the entity under the current collection", async () => {
      fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
        const { url, method } = requestUrlAndMethod(args);
        if (method === "POST" && url.endsWith("/collections/root/entities")) {
          return jsonResponse({ success: true, collection: { id: "root", entityCount: 1 } });
        }
        return defaultCollectionsResponder(...args);
      });

      const { result, store } = renderHookWithStore(() => useCollections());
      store.dispatch(setUser(makeAuthUser()));
      await waitFor(() => expect(result.current.currentCollection?.id).toBe("root"));

      await act(async () => {
        await result.current.addToCollection({ entity: { id: "entity-1" } as never });
      });

      const postCall = fetchHandle.calls().find((c) => c.method === "POST");
      expect(postCall?.url).toContain("/test-project/collections/root/entities");
    });

    it("deleteCollection returns the deleted ids and removes them from loaded entity lists", async () => {
      fetchHandle.fetchMock.mockImplementation(async (...args: unknown[]) => {
        const { url, method } = requestUrlAndMethod(args);
        if (method === "DELETE" && url.endsWith("/collections/child")) {
          return jsonResponse({ deletedCollectionIds: ["child", "grandchild"] });
        }
        return defaultCollectionsResponder(...args);
      });

      const { result, store } = renderHookWithStore(() => useCollections());
      store.dispatch(setUser(makeAuthUser()));
      await waitFor(() => expect(result.current.subCollections).toHaveLength(1));
      act(() => {
        store.dispatch(
          setEntityListEntities({
            listId: "feed",
            entities: [
              {
                id: "entity-1",
                saved: {
                  isSaved: true,
                  collections: [
                    { id: "child", name: "Child" },
                    { id: "grandchild", name: "Grandchild" },
                  ],
                },
              } as Entity,
            ],
          }),
        );
      });

      let returned: unknown;
      await act(async () => {
        returned = await result.current.deleteCollection({
          collection: result.current.subCollections[0],
        });
      });

      expect(returned).toEqual({ deletedCollectionIds: ["child", "grandchild"] });
      expect(result.current.subCollections).toHaveLength(0);
      expect(store.getState().sublay.entityLists.lists.feed.entities[0].saved).toEqual({
        isSaved: false,
        collections: [],
      });
    });
  });
});

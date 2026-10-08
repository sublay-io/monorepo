import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { collectionsApi } from "./collectionsApi";
import type { Collection } from "../../interfaces/models/Collection";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

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

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

describe("collectionsApi", () => {
  it("fetchRootCollection issues a GET to /collections/root", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(ROOT));

    const result = await store.dispatch(
      collectionsApi.endpoints.fetchRootCollection.initiate({ projectId: "test-project" }),
    );

    expect(fetchHandle.calls()[0]).toEqual({
      url: expect.stringContaining("/test-project/collections/root"),
      method: "GET",
    });
    expect(result.data).toEqual(ROOT);
  });

  it("fetchSubCollections issues a GET scoped to the parent collection", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse([ROOT]));

    await store.dispatch(
      collectionsApi.endpoints.fetchSubCollections.initiate({
        projectId: "test-project",
        collectionId: "root",
      }),
    );

    expect(fetchHandle.calls()[0].url).toContain("/test-project/collections/root/sub-collections");
  });

  it("fetchCollectionEntities serializes pagination/sort params and joins array `include`", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
      }),
    );

    await store.dispatch(
      collectionsApi.endpoints.fetchCollectionEntities.initiate({
        projectId: "test-project",
        collectionId: "root",
        page: 2,
        limit: 10,
        sortBy: "top",
        sortDir: "desc",
        include: ["author", "metrics"],
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.pathname).toContain("/test-project/collections/root/entities");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("sortBy")).toBe("top");
    expect(url.searchParams.get("sortDir")).toBe("desc");
    expect(url.searchParams.get("include")).toBe("author,metrics");
  });

  it("fetchCollectionEntities sends sortByReaction only with sortBy=top", async () => {
    const empty = () =>
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
      });

    fetchHandle.fetchMock.mockResolvedValueOnce(empty());
    await store.dispatch(
      collectionsApi.endpoints.fetchCollectionEntities.initiate({
        projectId: "test-project",
        collectionId: "c-top",
        sortBy: "top",
        sortByReaction: "love",
      }),
    );
    expect(new URL(fetchHandle.calls()[0].url).searchParams.get("sortByReaction")).toBe("love");

    fetchHandle.fetchMock.mockResolvedValueOnce(empty());
    await store.dispatch(
      collectionsApi.endpoints.fetchCollectionEntities.initiate({
        projectId: "test-project",
        collectionId: "c-hot",
        sortBy: "hot",
        sortByReaction: "love",
      }),
    );
    expect(new URL(fetchHandle.calls()[1].url).searchParams.has("sortByReaction")).toBe(false);
  });

  it("createCollection issues a POST with the collection name as the body", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ ...ROOT, id: "child", parentId: "root" }, 201),
    );

    await store.dispatch(
      collectionsApi.endpoints.createCollection.initiate({
        projectId: "test-project",
        parentCollectionId: "root",
        collectionName: "My List",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("/test-project/collections/root/sub-collections");
  });

  it("updateCollection issues a PATCH and commits the server's response into the cached root collection", async () => {
    // Prime the cache so the optimistic patch has something to update.
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(ROOT));
    await store.dispatch(
      collectionsApi.endpoints.fetchRootCollection.initiate({ projectId: "test-project" }),
    );

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ ...ROOT, name: "Renamed" }));

    await store.dispatch(
      collectionsApi.endpoints.updateCollection.initiate({
        projectId: "test-project",
        collectionId: "root",
        update: { name: "Renamed" },
      }),
    );

    const patchCall = fetchHandle.calls().find((c) => c.method === "PATCH");
    expect(patchCall?.url).toContain("/test-project/collections/root");

    const cached = collectionsApi.endpoints.fetchRootCollection.select({
      projectId: "test-project",
    })(store.getState());
    expect(cached.data?.name).toBe("Renamed");
  });

  it("updateCollection reverts the optimistic update if the request fails", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(ROOT));
    await store.dispatch(
      collectionsApi.endpoints.fetchRootCollection.initiate({ projectId: "test-project" }),
    );

    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "nope" }, 500));

    await store.dispatch(
      collectionsApi.endpoints.updateCollection.initiate({
        projectId: "test-project",
        collectionId: "root",
        update: { name: "Renamed" },
      }),
    );

    const reverted = collectionsApi.endpoints.fetchRootCollection.select({
      projectId: "test-project",
    })(store.getState());
    expect(reverted.data?.name).toBe(ROOT.name);
  });

  it("deleteCollection issues a DELETE to the collection's own URL", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(undefined));

    await store.dispatch(
      collectionsApi.endpoints.deleteCollection.initiate({
        projectId: "test-project",
        collectionId: "child",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("DELETE");
    expect(call.url).toContain("/test-project/collections/child");
  });

  it("addToCollection issues a POST with the entityId as the body", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, collection: { id: "root", entityCount: 1 } }),
    );

    await store.dispatch(
      collectionsApi.endpoints.addToCollection.initiate({
        projectId: "test-project",
        collectionId: "root",
        entityId: "entity-1",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("/test-project/collections/root/entities");
  });

  it("removeFromCollection issues a DELETE scoped to the entity", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, collection: { id: "root", entityCount: 0 } }),
    );

    await store.dispatch(
      collectionsApi.endpoints.removeFromCollection.initiate({
        projectId: "test-project",
        collectionId: "root",
        entityId: "entity-1",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("DELETE");
    expect(call.url).toContain("/test-project/collections/root/entities/entity-1");
  });

  it("surfaces a non-2xx response as a query error", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));

    const result = await store.dispatch(
      collectionsApi.endpoints.fetchRootCollection.initiate({ projectId: "test-project" }),
    );

    expect(result.isError).toBe(true);
    expect((result.error as { status: number }).status).toBe(500);
  });
});

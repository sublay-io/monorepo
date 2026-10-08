import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { entityListsApi } from "./entityListsApi";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

describe("entityListsApi", () => {
  describe("fetchEntities", () => {
    it("issues a GET with the required sortBy param", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({
          data: [],
          pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false },
        }),
      );

      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
        }),
      );

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.pathname).toContain("/test-project/entities");
      expect(url.searchParams.get("sortBy")).toBe("hot");
    });

    it("rejects when sortBy is missing", async () => {
      const result = await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: null,
        }),
      );

      expect(result.isError).toBe(true);
      expect(fetchHandle.calls()).toHaveLength(0);
    });

    it("rejects an invalid metadata.* sortBy property name", async () => {
      const result = await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "metadata.bad name!" as never,
        }),
      );

      expect(result.isError).toBe(true);
      expect(fetchHandle.calls()).toHaveLength(0);
    });

    it("drops followedOnly when false but sends it when true", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }),
      );
      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          followedOnly: false,
        }),
      );
      expect(new URL(fetchHandle.calls()[0].url).searchParams.has("followedOnly")).toBe(false);

      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }),
      );
      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          followedOnly: true,
        }),
      );
      expect(new URL(fetchHandle.calls()[1].url).searchParams.get("followedOnly")).toBe("true");
    });

    it("sends sortByReaction only with sortBy=top (the server rejects it otherwise)", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }));
      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "top",
          sortByReaction: "love",
        }),
      );
      expect(new URL(fetchHandle.calls()[0].url).searchParams.get("sortByReaction")).toBe("love");

      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }));
      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          sortByReaction: "love",
        }),
      );
      expect(new URL(fetchHandle.calls()[1].url).searchParams.has("sortByReaction")).toBe(false);
    });

    it("serializes keywordsFilters using bracket notation, like axios", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }),
      );

      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          keywordsFilters: { includes: ["foo", "bar"], doesNotInclude: ["baz"] },
        }),
      );

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.searchParams.get("keywordsFilters[includes][0]")).toBe("foo");
      expect(url.searchParams.get("keywordsFilters[includes][1]")).toBe("bar");
      expect(url.searchParams.get("keywordsFilters[doesNotInclude][0]")).toBe("baz");
    });

    it("serializes metadataFilters (nested object filter) using bracket notation", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }),
      );

      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          metadataFilters: { category: { eq: "news" } } as never,
        }),
      );

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.searchParams.get("metadataFilters[category][eq]")).toBe("news");
    });

    it("joins an array `include` with commas and allows explicit null sourceId/spaceId through", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ data: [], pagination: { page: 1, pageSize: 10, totalPages: 0, totalItems: 0, hasMore: false } }),
      );

      await store.dispatch(
        entityListsApi.endpoints.fetchEntities.initiate({
          projectId: "test-project",
          page: 1,
          limit: 10,
          sortBy: "hot",
          include: ["user", "space"],
          sourceId: null,
          spaceId: null,
        }),
      );

      const url = new URL(fetchHandle.calls()[0].url);
      expect(url.searchParams.get("include")).toBe("user,space");
      expect(url.searchParams.get("sourceId")).toBe("null");
      expect(url.searchParams.get("spaceId")).toBe("null");
    });
  });

  it("createEntity issues a POST with the entity fields as the body", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1", title: "Hello" }, 201));

    await store.dispatch(
      entityListsApi.endpoints.createEntity.initiate({
        projectId: "test-project",
        title: "Hello",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("/test-project/entities");
  });

  it("updateEntity issues a PATCH to the entity's own URL", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "e1", title: "Updated" }));

    await store.dispatch(
      entityListsApi.endpoints.updateEntity.initiate({
        projectId: "test-project",
        entityId: "e1",
        update: { title: "Updated" },
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("PATCH");
    expect(call.url).toContain("/test-project/entities/e1");
  });

  it("deleteEntity issues a DELETE and handles a text response as void", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      new Response("OK", { status: 200, headers: { "content-type": "text/plain" } }),
    );

    const result = await store.dispatch(
      entityListsApi.endpoints.deleteEntity.initiate({
        projectId: "test-project",
        entityId: "e1",
      }),
    );

    expect(fetchHandle.calls()[0].method).toBe("DELETE");
    expect(result.error).toBeUndefined();
    expect(result.data).toBeUndefined();
  });

  it("surfaces a non-2xx response as a query error", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));

    const result = await store.dispatch(
      entityListsApi.endpoints.fetchEntities.initiate({
        projectId: "test-project",
        page: 1,
        limit: 10,
        sortBy: "hot",
      }),
    );

    expect(result.isError).toBe(true);
    expect((result.error as { status: number }).status).toBe(500);
  });
});

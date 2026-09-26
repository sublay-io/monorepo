import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { tablesApi } from "./tablesApi";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

describe("tablesApi", () => {
  it("fetchTableRows builds a GET to the /db route with no params by default", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
      }),
    );

    await store.dispatch(
      tablesApi.endpoints.fetchTableRows.initiate({
        projectId: "test-project",
        tableName: "Events",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("GET");
    expect(call.url).toContain("/test-project/db/Events");
    expect(call.url).not.toContain("filters=");
    expect(call.url).not.toContain("includeDeleted=");
  });

  it("fetchTableRow builds a GET to the exact single-row route", async () => {
    const rowId = "3f0d9f2e-1c4a-4b7e-9f11-0a2b3c4d5e6f";
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ row: { id: rowId, name: "alpha" } }),
    );

    await store.dispatch(
      tablesApi.endpoints.fetchTableRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        rowId,
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("GET");
    // Full equality: a substring cannot catch an extra or reordered segment.
    expect(call.url).toBe(
      `https://api.sublay.io/v7/test-project/db/Events/${rowId}`,
    );
  });

  it("serializes filters as a JSON string param and includeDeleted as a string boolean", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
      }),
    );

    await store.dispatch(
      tablesApi.endpoints.fetchTableRows.initiate({
        projectId: "test-project",
        tableName: "Events",
        filters: [{ column: "name", operator: "eq", value: "alpha" }],
        includeDeleted: true,
        page: 2,
        limit: 10,
        sortBy: "name",
        sortDir: "asc",
      }),
    );

    const call = fetchHandle.calls()[0];
    const url = new URL(call.url);
    expect(JSON.parse(url.searchParams.get("filters")!)).toEqual([
      { column: "name", operator: "eq", value: "alpha" },
    ]);
    expect(url.searchParams.get("includeDeleted")).toBe("true");
    expect(url.searchParams.get("page")).toBe("2");
    expect(url.searchParams.get("limit")).toBe("10");
    expect(url.searchParams.get("sortBy")).toBe("name");
    expect(url.searchParams.get("sortDir")).toBe("asc");
  });

  it("omits the filters param when the filters array is empty", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({
        data: [],
        pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
      }),
    );

    await store.dispatch(
      tablesApi.endpoints.fetchTableRows.initiate({
        projectId: "test-project",
        tableName: "Events",
        filters: [],
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.searchParams.has("filters")).toBe(false);
  });

  it("surfaces a non-2xx response as a query error rather than throwing", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ message: "boom" }, 500),
    );

    const result = await store.dispatch(
      tablesApi.endpoints.fetchTableRows.initiate({
        projectId: "test-project",
        tableName: "Events",
      }),
    );

    expect(result.isError).toBe(true);
    expect((result.error as { status: number }).status).toBe(500);
  });

  it("createRow issues a POST with the row data as the body", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ row: { id: "1" } }, 201),
    );

    await store.dispatch(
      tablesApi.endpoints.createRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        data: { name: "alpha" },
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("/test-project/db/Events");
  });

  it("updateRow issues a PATCH to the row's own URL", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ row: { id: "1", name: "bravo" } }),
    );

    await store.dispatch(
      tablesApi.endpoints.updateRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        rowId: "1",
        data: { name: "bravo" },
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("PATCH");
    expect(call.url).toContain("/test-project/db/Events/1");
  });

  it("deleteRow issues a DELETE without a force param by default", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ deleted: true, soft: true }),
    );

    await store.dispatch(
      tablesApi.endpoints.deleteRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        rowId: "1",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("DELETE");
    expect(new URL(call.url).searchParams.has("force")).toBe(false);
  });

  it("deleteRow passes force=true when requested", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ deleted: true, soft: false }),
    );

    await store.dispatch(
      tablesApi.endpoints.deleteRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        rowId: "1",
        force: true,
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.searchParams.get("force")).toBe("true");
  });

  it("restoreRow issues a POST to the row's /restore route", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ row: { id: "1", deletedAt: null } }),
    );

    await store.dispatch(
      tablesApi.endpoints.restoreRow.initiate({
        projectId: "test-project",
        tableName: "Events",
        rowId: "1",
      }),
    );

    const call = fetchHandle.calls()[0];
    expect(call.method).toBe("POST");
    expect(call.url).toContain("/test-project/db/Events/1/restore");
  });
});

import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { workspacesApi } from "./workspacesApi";

let fetchHandle: FetchMockHandle;
let store: RtkQueryStore;

const emptyPage = () =>
  jsonResponse({
    data: [],
    pagination: { page: 1, pageSize: 20, totalPages: 0, totalItems: 0, hasMore: false },
  });

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => emptyPage());
  store = makeRtkQueryStore();
});

afterEach(() => {
  unstubFetchMock();
});

describe("workspacesApi.fetchWorkspaces", () => {
  it("sends every set filter, joining include with commas", async () => {
    await store.dispatch(
      workspacesApi.endpoints.fetchWorkspaces.initiate({
        projectId: "test-project",
        page: 2,
        limit: 10,
        relation: "direct",
        parentWorkspaceId: "any",
        sortDir: "asc",
        include: ["memberCount"],
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.pathname).toBe("/v8/test-project/workspaces");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      page: "2",
      limit: "10",
      relation: "direct",
      parentWorkspaceId: "any",
      sortDir: "asc",
      include: "memberCount",
    });
  });

  it("leaves out null and unset filters, and never sends the string \"null\"", async () => {
    await store.dispatch(
      workspacesApi.endpoints.fetchWorkspaces.initiate({
        projectId: "test-project",
        relation: null,
        parentWorkspaceId: null,
        sortDir: null,
        include: null,
      }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.search).toBe("");
  });
});

describe("workspacesApi.fetchWorkspace", () => {
  it("gets one workspace, with include when set", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "w1" }));
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ id: "w2" }));
    await store.dispatch(
      workspacesApi.endpoints.fetchWorkspace.initiate({ projectId: "test-project", workspaceId: "w1" }),
    );
    await store.dispatch(
      workspacesApi.endpoints.fetchWorkspace.initiate({
        projectId: "test-project",
        workspaceId: "w2",
        include: ["memberCount"],
      }),
    );

    const [first, second] = fetchHandle.calls().map((c) => new URL(c.url));
    expect(first.pathname).toBe("/v8/test-project/workspaces/w1");
    expect(first.search).toBe("");
    expect(second.pathname).toBe("/v8/test-project/workspaces/w2");
    expect(second.searchParams.get("include")).toBe("memberCount");
  });
});

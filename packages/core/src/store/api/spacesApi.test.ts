import { describe, it, expect, beforeEach, afterEach } from "vitest";

import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
  type RtkQueryStore,
} from "../../test-utils";
import { spacesApi } from "./spacesApi";

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

describe("spacesApi.fetchSpaces", () => {
  it("lists top-level spaces by default: parentSpaceId=none when left out or null", async () => {
    await store.dispatch(
      spacesApi.endpoints.fetchSpaces.initiate({ projectId: "test-project", page: 1 }),
    );
    await store.dispatch(
      spacesApi.endpoints.fetchSpaces.initiate({ projectId: "test-project", page: 2, parentSpaceId: null }),
    );

    const [first, second] = fetchHandle.calls().map((c) => new URL(c.url).searchParams);
    expect(first.get("parentSpaceId")).toBe("none");
    expect(second.get("parentSpaceId")).toBe("none");
    expect(second.get("page")).toBe("2");
  });

  it("sends an explicit \"none\" or a parent id as given, and never the string \"null\"", async () => {
    await store.dispatch(
      spacesApi.endpoints.fetchSpaces.initiate({ projectId: "test-project", parentSpaceId: "none" }),
    );
    await store.dispatch(
      spacesApi.endpoints.fetchSpaces.initiate({ projectId: "test-project", parentSpaceId: "parent-1" }),
    );

    const [first, second] = fetchHandle.calls().map((c) => new URL(c.url));
    expect(first.searchParams.get("parentSpaceId")).toBe("none");
    expect(second.searchParams.get("parentSpaceId")).toBe("parent-1");
    expect(first.search).not.toContain("null");
  });
});

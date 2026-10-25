import { describe, it, expect, beforeEach, afterEach } from "vitest";

import { serializeQueryParams } from "./queryParams";
import { baseApi } from "../store/api/baseApi";
import {
  makeRtkQueryStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../test-utils";

describe("serializeQueryParams", () => {
  it("leaves out null and undefined, and keeps every other value as a string", () => {
    expect(
      serializeQueryParams({
        a: null,
        b: undefined,
        sourceId: "none",
        page: 2,
        flag: false,
        empty: "",
      }),
    ).toBe("sourceId=none&page=2&flag=false&empty=");
  });
});

describe("baseApi params", () => {
  let fetchHandle: FetchMockHandle;

  beforeEach(() => {
    fetchHandle = stubFetchMock(async () => jsonResponse({}));
  });

  afterEach(() => {
    unstubFetchMock();
  });

  it("never sends a null param as the string \"null\"", async () => {
    const api = baseApi.injectEndpoints({
      endpoints: (builder) => ({
        probeNullParams: builder.query<unknown, Record<string, unknown>>({
          query: (params) => ({ url: "/probe", params }),
        }),
      }),
      overrideExisting: true,
    });
    const store = makeRtkQueryStore();

    await store.dispatch(
      api.endpoints.probeNullParams.initiate({ parentSpaceId: null, sourceId: "none", page: 1 }),
    );

    const url = new URL(fetchHandle.calls()[0].url);
    expect(url.searchParams.has("parentSpaceId")).toBe(false);
    expect(url.searchParams.get("sourceId")).toBe("none");
    expect(url.searchParams.get("page")).toBe("1");
    expect(url.search).not.toContain("null");
  });
});

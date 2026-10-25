import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useFetchManySpaces from "./useFetchManySpaces";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Space } from "../../interfaces/models/Space";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(spaces: Space[]): PaginatedResponse<Space> {
  return {
    data: spaces,
    pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: spaces.length, hasMore: false },
  };
}

describe("useFetchManySpaces", () => {
  it("fetches a page of spaces with the expected params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManySpaces());

    const page = makePage([makeSpace()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Space> | undefined;
    await act(async () => {
      returned = await result.current({ page: 1, sortBy: "createdAt", query: "design" });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces");
    expect(call.config?.params).toMatchObject({ page: 1, sortBy: "createdAt", query: "design" });
  });

  it("sends searchFields, memberOf as 'true'/'false', and leaves a blank query out", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManySpaces());

    axiosPrivate.mockResponse("get", makePage([]));
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ query: "des", searchFields: "slug", memberOf: true });
    });
    await act(async () => {
      await result.current({ query: "   ", memberOf: false });
    });

    const [first, second] = axiosPrivate.calls("get");
    expect(first.config?.params).toMatchObject({ query: "des", searchFields: "slug", memberOf: "true" });
    expect(second.config?.params).toMatchObject({ memberOf: "false" });
    expect(second.config?.params).not.toHaveProperty("query");
  });

  it("lists every level by default: parentSpaceId is left out when not set or null", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManySpaces());

    axiosPrivate.mockResponse("get", makePage([]));
    axiosPrivate.mockResponse("get", makePage([]));
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current();
    });
    await act(async () => {
      await result.current({ parentSpaceId: null });
    });
    await act(async () => {
      await result.current({ parentSpaceId: undefined });
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(3);
    for (const call of calls) {
      expect(call.config?.params ?? {}).not.toHaveProperty("parentSpaceId");
    }
  });

  it("sends an explicit \"none\" or a parent id as given", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManySpaces());

    axiosPrivate.mockResponse("get", makePage([]));
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ parentSpaceId: "none" });
    });
    await act(async () => {
      await result.current({ parentSpaceId: "parent-1" });
    });

    const [first, second] = axiosPrivate.calls("get");
    expect(first.config?.params).toMatchObject({ parentSpaceId: "none" });
    expect(second.config?.params).toMatchObject({ parentSpaceId: "parent-1" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManySpaces());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManySpaces(),
      { projectId: "" },
    );

    await expect(result.current()).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

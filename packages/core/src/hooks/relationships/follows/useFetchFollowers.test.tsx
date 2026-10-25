import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser, makeUser } from "../../../test-utils";
import useFetchFollowers from "./useFetchFollowers";
import type { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import type { FollowerWithFollowInfo } from "./useFetchFollowers";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(items: FollowerWithFollowInfo[]): PaginatedResponse<FollowerWithFollowInfo> {
  return {
    data: items,
    pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: items.length, hasMore: false },
  };
}

describe("useFetchFollowers", () => {
  it("fetches the current user's followers list", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowers(), { user });

    const page = makePage([{ followId: "follow-1", user: makeUser(), followedAt: "2024-01-01T00:00:00.000Z" }]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<FollowerWithFollowInfo> | undefined;
    await act(async () => {
      returned = await result.current({ page: 1, limit: 20 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/follows/followers");
    expect(call.config?.params).toEqual({ page: 1, limit: 20 });
  });

  it("sends query + searchFields, and leaves both out for a blank query", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowers(), { user });

    axiosPrivate.mockResponse("get", makePage([]));
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ query: "ann", searchFields: "username" });
    });
    await act(async () => {
      await result.current({ query: "   ", searchFields: "username" });
    });

    const [first, second] = axiosPrivate.calls("get");
    expect(first.config?.params).toEqual({ page: 1, limit: 20, query: "ann", searchFields: "username" });
    expect(second.config?.params).not.toHaveProperty("query");
    expect(second.config?.params).not.toHaveProperty("searchFields");
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowers(), { user });

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowers());

    await expect(result.current()).rejects.toThrow("No user is logged in.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

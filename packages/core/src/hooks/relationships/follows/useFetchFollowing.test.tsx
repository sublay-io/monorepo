import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser, makeUser } from "../../../test-utils";
import useFetchFollowing from "./useFetchFollowing";
import type { PaginatedResponse } from "../../../interfaces/PaginatedResponse";
import type { FollowRow } from "../../../interfaces/models/Follow";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(items: FollowRow[]): PaginatedResponse<FollowRow> {
  return {
    data: items,
    pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: items.length, hasMore: false },
  };
}

describe("useFetchFollowing", () => {
  it("fetches the current user's following list", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowing(), { user });

    const page = makePage([{ id: "follow-1", user: makeUser(), createdAt: "2024-01-01T00:00:00.000Z" }]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<FollowRow> | undefined;
    await act(async () => {
      returned = await result.current({ page: 1, limit: 20 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/follows/following");
    expect(call.config?.params).toEqual({ page: 1, limit: 20 });
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowing(), { user });

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowing());

    await expect(result.current()).rejects.toThrow("No user is logged in.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

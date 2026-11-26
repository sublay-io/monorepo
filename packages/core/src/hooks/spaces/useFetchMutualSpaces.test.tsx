import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useFetchMutualSpaces from "./useFetchMutualSpaces";
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

describe("useFetchMutualSpaces", () => {
  it("fetches spaces shared with another user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchMutualSpaces());

    const page = makePage([makeSpace()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Space> | undefined;
    await act(async () => {
      returned = await result.current({ userId: "user-2", page: 1 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/mutual/user-2");
    expect(call.config?.params).toMatchObject({ page: 1 });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchMutualSpaces());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ userId: "user-2" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchMutualSpaces(),
      { projectId: "" },
    );

    await expect(result.current({ userId: "user-2" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

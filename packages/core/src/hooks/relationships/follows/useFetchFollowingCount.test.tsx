import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../../test-utils";
import useFetchFollowingCount from "./useFetchFollowingCount";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchFollowingCount", () => {
  it("fetches the current user's following count", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowingCount(), { user });

    axiosPrivate.mockResponse("get", { count: 7 });

    let returned: number | undefined;
    await act(async () => {
      returned = await result.current();
    });

    expect(returned).toBe(7);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/follows/following-count");
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowingCount(), { user });

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowingCount());

    await expect(result.current()).rejects.toThrow("No user is logged in.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

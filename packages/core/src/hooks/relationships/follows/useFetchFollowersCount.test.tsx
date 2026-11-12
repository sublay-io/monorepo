import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../../test-utils";
import useFetchFollowersCount from "./useFetchFollowersCount";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchFollowersCount", () => {
  it("fetches the current user's followers count", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowersCount(), { user });

    axiosPrivate.mockResponse("get", { count: 12 });

    let returned: number | undefined;
    await act(async () => {
      returned = await result.current();
    });

    expect(returned).toBe(12);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/follows/followers-count");
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowersCount(), { user });

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchFollowersCount());

    await expect(result.current()).rejects.toThrow("No user is logged in.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

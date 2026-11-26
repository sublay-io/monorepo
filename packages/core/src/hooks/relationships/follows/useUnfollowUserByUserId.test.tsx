import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../../test-utils";
import useUnfollowUserByUserId from "./useUnfollowUserByUserId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUnfollowUserByUserId", () => {
  it("unfollows a user by ID", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowUserByUserId(), { user });

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ userId: "user-2" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/users/user-2/follow");
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowUserByUserId(), { user });

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ userId: "user-2" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when unfollowing yourself", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowUserByUserId(), { user });

    await expect(result.current({ userId: "user-1" })).rejects.toThrow(
      "Users can't unfollow themselves",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowUserByUserId());

    await expect(result.current({ userId: "user-2" })).rejects.toThrow(
      "No user is logged in",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser, makeUser } from "../../../test-utils";
import useFollowManager from "./useFollowManager";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFollowManager", () => {
  it("loads the follow status on mount and toggles to unfollow", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFollowManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", {
            isFollowing: true,
            follow: { id: "follow-1", user: makeUser({ id: "user-2" }), createdAt: "2024-01-01T00:00:00.000Z" },
          }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isFollowing).toBe(true);

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(result.current.isFollowing).toBe(false);
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/users/user-2/follow");
  });

  it("toggles to follow when not currently following", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFollowManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", { isFollowing: false }),
      },
    );

    await waitFor(() => expect(result.current.isFollowing).toBe(false));

    axiosPrivate.mockResponse(
      "post",
      { id: "follow-1", user: makeUser({ id: "user-2" }), createdAt: "2024-01-01T00:00:00.000Z" },
      201,
    );

    await act(async () => {
      await result.current.toggleFollow();
    });

    expect(result.current.isFollowing).toBe(true);
    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/users/user-2/follow");
  });

  it("does not fetch and stays idle when checking your own userId", () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFollowManager({ userId: "user-1" }),
      { user },
    );

    expect(result.current.isFollowing).toBeNull();
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("falls back to isFollowing=false without throwing when the status fetch fails", async () => {
    const user = makeAuthUser({ id: "user-1" });

    const { result } = renderHookWithAxios(
      () => useFollowManager({ userId: "user-2" }),
      {
        user,
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.isLoading).toBe(false));
    expect(result.current.isFollowing).toBe(false);
  });
});

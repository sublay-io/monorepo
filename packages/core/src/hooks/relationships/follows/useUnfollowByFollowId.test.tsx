import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeAuthUser } from "../../../test-utils";
import useUnfollowByFollowId from "./useUnfollowByFollowId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUnfollowByFollowId", () => {
  it("unfollows by follow ID", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowByFollowId(), { user });

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ followId: "follow-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/follows/follow-1");
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowByFollowId(), { user });

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ followId: "follow-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no follow ID is passed", async () => {
    const user = makeAuthUser();
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowByFollowId(), { user });

    await expect(result.current({ followId: "" })).rejects.toThrow(
      "No follow ID was provided",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnfollowByFollowId());

    await expect(result.current({ followId: "follow-1" })).rejects.toThrow(
      "No user is logged in",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

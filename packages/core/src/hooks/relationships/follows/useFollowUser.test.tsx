import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeUser } from "../../../test-utils";
import useFollowUser from "./useFollowUser";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFollowUser", () => {
  it("follows a user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFollowUser());

    const row = { id: "follow-1", user: makeUser({ id: "user-2" }), createdAt: "2024-01-01T00:00:00.000Z" };
    axiosPrivate.mockResponse("post", row, 201);

    let returned: unknown;
    await act(async () => {
      returned = await result.current({ userId: "user-2" });
    });

    // The follow row: `user` is the followed user.
    expect(returned).toEqual(row);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/users/user-2/follow");
    expect(call.body).toEqual({});
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFollowUser());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ userId: "user-2" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no user ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFollowUser());

    await expect(result.current({ userId: "" })).rejects.toThrow(
      "No user ID was provided",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFollowUser(), {
      projectId: "",
    });

    await expect(result.current({ userId: "user-2" })).rejects.toThrow(
      "No project specified",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

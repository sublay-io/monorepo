import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useAddMember from "./useAddMember";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAddMember", () => {
  it("posts the user to add to the space's members route", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddMember());

    const response = {
      message: "User added to the space.",
      membership: {
        id: "membership-1",
        spaceId: "space-1",
        userId: "user-2",
        role: "member" as const,
        status: "active" as const,
        joinedAt: "2026-01-01T00:00:00.000Z",
        createdAt: "2026-01-01T00:00:00.000Z",
      },
    };
    axiosPrivate.mockResponse("post", response);

    let returned;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", userId: "user-2" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/members");
    expect(call.body).toEqual({ userId: "user-2" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddMember());

    axiosPrivate.mockError("post", 409, { code: "space/member-banned" });

    await expect(
      result.current({ spaceId: "space-1", userId: "user-2" }),
    ).rejects.toMatchObject({ response: { status: 409 } });
  });

  it("throws before making a request when required fields are missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddMember());

    await expect(
      result.current({ spaceId: "space-1", userId: "" }),
    ).rejects.toThrow("spaceId and userId are required");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

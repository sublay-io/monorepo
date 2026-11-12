import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUnbanMember from "./useUnbanMember";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUnbanMember", () => {
  it("unbans a member", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnbanMember());

    const response = {
      message: "Unbanned",
      membership: {
        id: "membership-1",
        projectId: "test-project",
        spaceId: "space-1",
        userId: "user-2",
        role: "member" as const,
        status: "active" as const,
        joinedAt: "2024-01-01T00:00:00.000Z",
        createdAt: "2024-01-01T00:00:00.000Z",
      },
    };
    axiosPrivate.mockResponse("post", response);

    let returned;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", userId: "user-2" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/members/user-2/unban");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnbanMember());

    axiosPrivate.mockError("post", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", userId: "user-2" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when required fields are missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUnbanMember());

    await expect(
      result.current({ spaceId: "space-1", userId: "" }),
    ).rejects.toThrow("spaceId and userId are required");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

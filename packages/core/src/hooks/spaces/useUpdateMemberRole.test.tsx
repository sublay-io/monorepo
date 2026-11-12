import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUpdateMemberRole from "./useUpdateMemberRole";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateMemberRole", () => {
  it("updates a member's role", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateMemberRole());

    const response = {
      message: "Updated",
      membership: { id: "membership-1", role: "moderator" as const, status: "active", joinedAt: "2024-01-01T00:00:00.000Z", userId: "user-2" },
    };
    axiosPrivate.mockResponse("patch", response);

    let returned;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", userId: "user-2", role: "moderator" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/members/user-2/role");
    expect(call.body).toEqual({ role: "moderator" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateMemberRole());

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", userId: "user-2", role: "admin" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when required fields are missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateMemberRole());

    await expect(
      result.current({ spaceId: "space-1", userId: "", role: "admin" }),
    ).rejects.toThrow("spaceId, userId, and role are required");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useCheckMyMembership from "./useCheckMyMembership";
import type { CheckMyMembershipResponse } from "../../interfaces/models/Space";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCheckMyMembership", () => {
  it("checks the current user's membership in a space", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCheckMyMembership());

    const response: CheckMyMembershipResponse = {
      isMember: true,
      role: "member",
      status: "active",
      joinedAt: "2024-01-01T00:00:00.000Z",
      permissions: { canPost: true, canModerate: false, canRead: true, isAdmin: false },
    } as CheckMyMembershipResponse;
    axiosPrivate.mockResponse("get", response);

    let returned: CheckMyMembershipResponse | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/members/me");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCheckMyMembership());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCheckMyMembership());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

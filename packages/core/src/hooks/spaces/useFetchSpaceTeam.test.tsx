import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchSpaceTeam from "./useFetchSpaceTeam";
import type { SpaceMemberWithUser } from "../../interfaces/models/SpaceMember";

afterEach(() => {
  resetAxiosMocks();
});

function makeMember(overrides: Partial<SpaceMemberWithUser> = {}): SpaceMemberWithUser {
  return {
    membershipId: "membership-1",
    role: "admin",
    status: "active",
    joinedAt: "2024-01-01T00:00:00.000Z",
    user: { id: "user-1", username: "alice", displayName: "Alice", avatar: "", metadata: {} },
    ...overrides,
  };
}

describe("useFetchSpaceTeam", () => {
  it("returns the space's admins and moderators as an array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceTeam());

    const member = makeMember();
    axiosPrivate.mockResponse("get", { data: [member] });

    let returned: SpaceMemberWithUser[] | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual([member]);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/team");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceTeam());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceTeam());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

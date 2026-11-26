import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import { makeUser } from "../../test-utils/modelFactories";
import useFetchSpaceMembers from "./useFetchSpaceMembers";
import type { SpaceMembersResponse, SpaceMemberWithUser } from "../../interfaces/models/SpaceMember";

afterEach(() => {
  resetAxiosMocks();
});

function makeMember(overrides: Partial<SpaceMemberWithUser> = {}): SpaceMemberWithUser {
  return {
    membershipId: "membership-1",
    role: "member",
    status: "active",
    joinedAt: "2024-01-01T00:00:00.000Z",
    user: makeUser({ id: "user-1", username: "alice", name: "Alice" }),
    ...overrides,
  };
}

describe("useFetchSpaceMembers", () => {
  it("fetches a page of space members", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceMembers());

    const response: SpaceMembersResponse = {
      data: [makeMember()],
      pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: 1, hasMore: false },
    };
    axiosPrivate.mockResponse("get", response);

    let returned: SpaceMembersResponse | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1", page: 1, role: "admin" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/members");
    expect(call.config?.params).toMatchObject({ page: 1, role: "admin" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceMembers());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceMembers());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

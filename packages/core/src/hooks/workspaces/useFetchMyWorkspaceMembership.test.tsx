import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useFetchMyWorkspaceMembership from "./useFetchMyWorkspaceMembership";
import type { WorkspaceMemberStanding } from "../../interfaces/models/Workspace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchMyWorkspaceMembership", () => {
  it("gets /workspaces/:workspaceId/members/me with no query params and returns the record", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );

    const standing: WorkspaceMemberStanding = {
      user: { id: "user-1" },
      reasons: [{ type: "member" }],
      capabilities: ["view"],
      permissions: [],
      rank: 3,
      relativeRank: 0,
      title: "Editor",
      metadata: {},
    };
    axiosPrivate.mockResponse("get", standing);

    let returned: WorkspaceMemberStanding | undefined;
    await act(async () => {
      returned = await result.current({ workspaceId: "w1" });
    });

    expect(returned).toEqual(standing);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/project-1/workspaces/w1/members/me");
    // The actor is the token subject: no actingUserId, no user id in the path.
    expect(call.config).toBeUndefined();
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );

    axiosPrivate.mockError("get", 404, { code: "workspace/not-found" });

    await expect(
      result.current({ workspaceId: "w1" })
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("throws before requesting when workspaceId is missing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );

    await expect(
      // @ts-expect-error deliberately omitting workspaceId
      result.current({})
    ).rejects.toThrow("Please pass a workspaceId");

    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

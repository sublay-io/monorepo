import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useAcceptWorkspaceInvite from "./useAcceptWorkspaceInvite";
import type { WorkspaceMemberStanding } from "../../interfaces/models/Workspace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAcceptWorkspaceInvite", () => {
  it("posts an EMPTY body to the non-:id-scoped accept route (actor from token) and returns the standing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useAcceptWorkspaceInvite(),
      { projectId: "project-1", user }
    );

    const response: WorkspaceMemberStanding = {
      user: { id: "user-1" },
      reasons: [{ type: "member" }],
      capabilities: [],
      permissions: [],
      rank: 1,
      relativeRank: 0,
      title: null,
      metadata: {},
    };
    axiosPrivate.mockResponse("post", response);

    let returned: WorkspaceMemberStanding | undefined;
    await act(async () => {
      returned = await result.current({ inviteId: "i1" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/project-1/workspace-invites/i1/accept");
    // Empty body — no userId leak; identity is matched from the token.
    expect(call.body).toEqual({});
  });

  it("throws before requesting when inviteId is missing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useAcceptWorkspaceInvite(),
      { projectId: "project-1", user }
    );

    await expect(
      // @ts-expect-error deliberately omitting inviteId
      result.current({})
    ).rejects.toThrow("Please pass an inviteId");

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("rejects when the server rejects the accept (e.g. verified-email gate)", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useAcceptWorkspaceInvite(),
      { projectId: "project-1", user }
    );

    axiosPrivate.mockError("post", 403, { code: "workspace/email-not-verified" });

    await expect(result.current({ inviteId: "i1" })).rejects.toMatchObject({
      status: 403,
    });
  });
});

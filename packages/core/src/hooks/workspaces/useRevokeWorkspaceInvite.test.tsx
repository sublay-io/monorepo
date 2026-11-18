import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useRevokeWorkspaceInvite from "./useRevokeWorkspaceInvite";

afterEach(() => {
  resetAxiosMocks();
});

describe("useRevokeWorkspaceInvite", () => {
  it("POSTs (not DELETEs) to .../invites/:inviteId/revoke with an empty body", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useRevokeWorkspaceInvite(),
      { projectId: "project-1", user }
    );

    axiosPrivate.mockResponse("post", "", 204);

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current({ workspaceId: "w1", inviteId: "i1" });
    });

    expect(returned).toBeUndefined();

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/project-1/workspaces/w1/invites/i1/revoke");
    // Empty body — no actor userId; the actor is the token subject.
    expect(call.body).toEqual({});
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before requesting when workspaceId or inviteId is missing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useRevokeWorkspaceInvite(),
      { projectId: "project-1", user }
    );

    await expect(
      // @ts-expect-error deliberately omitting workspaceId
      result.current({ inviteId: "i1" })
    ).rejects.toThrow("Please pass a workspaceId");

    await expect(
      // @ts-expect-error deliberately omitting inviteId
      result.current({ workspaceId: "w1" })
    ).rejects.toThrow("Please pass an inviteId");

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

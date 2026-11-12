import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useUpdateMyWorkspaceMembership from "./useUpdateMyWorkspaceMembership";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateMyWorkspaceMembership", () => {
  it("patches /workspaces/:workspaceId/members/me with only the title and returns the member", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useUpdateMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );

    const member = { id: "m1", userId: "user-1", rank: 6, title: "Scout" };
    axiosPrivate.mockResponse("patch", member);

    let returned: unknown;
    await act(async () => {
      returned = await result.current({ workspaceId: "w1", title: "Scout" });
    });

    expect(returned).toEqual(member);
    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/project-1/workspaces/w1/members/me");
    // The actor is the token subject: no actingUserId, no user id anywhere.
    expect(call.body).toEqual({ title: "Scout" });
  });

  it("sends `title: null` to clear the title", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useUpdateMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );
    axiosPrivate.mockResponse("patch", { id: "m1", title: null });

    await act(async () => {
      await result.current({ workspaceId: "w1", title: null });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).toEqual({ title: null });
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useUpdateMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );
    axiosPrivate.mockError("patch", 404, { code: "workspace/not-found" });

    await expect(
      result.current({ workspaceId: "w1", title: "X" })
    ).rejects.toMatchObject({ response: { status: 404 } });
  });

  it("throws before requesting when workspaceId is missing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useUpdateMyWorkspaceMembership(),
      { projectId: "project-1", user }
    );

    await expect(
      // @ts-expect-error deliberately omitting workspaceId
      result.current({ title: "X" })
    ).rejects.toThrow("Please pass a workspaceId");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});

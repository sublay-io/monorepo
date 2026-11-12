import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useFetchWorkspaceMembers from "./useFetchWorkspaceMembers";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchWorkspaceMembers", () => {
  it("gets /workspaces/:id/members forwarding include + countOnly params", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchWorkspaceMembers(),
      { projectId: "project-1", user }
    );

    const roster = { data: [], total: 0 };
    axiosPrivate.mockResponse("get", roster);

    await act(async () => {
      await result.current({
        workspaceId: "w1",
        include: "descendants",
        countOnly: true,
      });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/project-1/workspaces/w1/members");
    expect(call.config?.params).toEqual({
      include: "descendants",
      countOnly: true,
    });
    // Actor from the token — no userId param.
    expect(call.config?.params).not.toHaveProperty("userId");
  });

  it("omits absent optional params", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchWorkspaceMembers(),
      { projectId: "project-1", user }
    );

    axiosPrivate.mockResponse("get", { data: [], total: 0 });

    await act(async () => {
      await result.current({ workspaceId: "w1" });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toEqual({});
  });

  it("returns the roster as an array, not the server's { data, total } envelope", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchWorkspaceMembers(),
      { projectId: "project-1", user }
    );

    const entries = [{ user: { id: "user-2" }, reasons: [] }];
    axiosPrivate.mockResponse("get", { data: entries, total: 1 });

    let returned: unknown;
    await act(async () => {
      returned = await result.current({ workspaceId: "w1" });
    });

    expect(returned).toEqual(entries);
  });

  it("returns the counts record as-is with countOnly", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchWorkspaceMembers(),
      { projectId: "project-1", user }
    );

    const counts = {
      counts: {
        owner: 1,
        member: 2,
        ancestorOwner: 0,
        reachHolder: 0,
        descendantMember: 0,
      },
      total: 3,
      distinctUsers: 3,
    };
    axiosPrivate.mockResponse("get", counts);

    let returned: unknown;
    await act(async () => {
      returned = await result.current({ workspaceId: "w1", countOnly: true });
    });

    expect(returned).toEqual(counts);
  });

  it("throws before requesting when workspaceId is missing", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchWorkspaceMembers(),
      { projectId: "project-1", user }
    );

    await expect(
      // @ts-expect-error deliberately omitting workspaceId
      result.current({})
    ).rejects.toThrow("Please pass a workspaceId");

    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

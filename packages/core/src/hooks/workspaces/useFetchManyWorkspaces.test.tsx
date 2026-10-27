import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useFetchManyWorkspaces from "./useFetchManyWorkspaces";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Workspace } from "../../interfaces/models/Workspace";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(
  workspaces: Partial<Workspace>[],
  hasMore = false
): PaginatedResponse<Workspace> {
  return {
    data: workspaces as Workspace[],
    pagination: {
      page: 1,
      pageSize: 10,
      totalPages: hasMore ? 2 : 1,
      totalItems: workspaces.length,
      hasMore,
    },
  };
}

describe("useFetchManyWorkspaces", () => {
  it("gets /workspaces forwarding only defined pagination/include params (no actor userId)", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyWorkspaces(),
      { projectId: "project-1", user }
    );

    const page = makePage([{ id: "w1" }]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Workspace> | undefined;
    await act(async () => {
      returned = await result.current({ page: 2, limit: 5, include: "memberCount" });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/project-1/workspaces");
    expect(call.config?.params).toEqual({ page: 2, limit: 5, include: "memberCount" });
    expect(call.config?.params).not.toHaveProperty("userId");
  });

  it("omits undefined params entirely", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyWorkspaces(),
      { projectId: "project-1", user }
    );

    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current();
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toEqual({});
  });

  it("sends parentWorkspaceId as given, and leaves it out when null", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyWorkspaces(),
      { projectId: "project-1", user }
    );

    for (let i = 0; i < 4; i += 1) axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ parentWorkspaceId: "none" });
    });
    await act(async () => {
      await result.current({ parentWorkspaceId: "any" });
    });
    await act(async () => {
      await result.current({ parentWorkspaceId: "w-parent" });
    });
    await act(async () => {
      await result.current({ parentWorkspaceId: null });
    });

    const calls = axiosPrivate.calls("get");
    expect(calls[0].config?.params).toEqual({ parentWorkspaceId: "none" });
    expect(calls[1].config?.params).toEqual({ parentWorkspaceId: "any" });
    expect(calls[2].config?.params).toEqual({ parentWorkspaceId: "w-parent" });
    expect(calls[3].config?.params).toEqual({});
  });

  it("sends relation and sortDir as given, and leaves them out when null", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyWorkspaces(),
      { projectId: "project-1", user }
    );

    for (let i = 0; i < 3; i += 1) axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ relation: "direct", sortDir: "asc", parentWorkspaceId: "any" });
    });
    await act(async () => {
      await result.current({ relation: "reachable", sortDir: "desc" });
    });
    await act(async () => {
      await result.current({ relation: null, sortDir: null });
    });

    const calls = axiosPrivate.calls("get");
    expect(calls[0].config?.params).toEqual({
      relation: "direct",
      sortDir: "asc",
      parentWorkspaceId: "any",
    });
    expect(calls[1].config?.params).toEqual({ relation: "reachable", sortDir: "desc" });
    expect(calls[2].config?.params).toEqual({});
  });
});

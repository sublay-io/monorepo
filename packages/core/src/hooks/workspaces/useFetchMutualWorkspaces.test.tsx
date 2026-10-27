import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchMutualWorkspaces from "./useFetchMutualWorkspaces";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Workspace } from "../../interfaces/models/Workspace";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(workspaces: Partial<Workspace>[]): PaginatedResponse<Workspace> {
  return {
    data: workspaces as Workspace[],
    pagination: {
      page: 1,
      pageSize: 20,
      totalPages: 1,
      totalItems: workspaces.length,
      hasMore: false,
    },
  };
}

describe("useFetchMutualWorkspaces", () => {
  it("gets /workspaces/mutual/:userId with the given params (no actor userId)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchMutualWorkspaces());

    const page = makePage([{ id: "w1", reasons: [{ type: "owner" }] }]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Workspace> | undefined;
    await act(async () => {
      returned = await result.current({
        userId: "user-2",
        page: 2,
        limit: 5,
        include: ["memberCount"],
        relation: "direct",
        sortDir: "asc",
      });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/workspaces/mutual/user-2");
    expect(call.config?.params).toEqual({
      page: 2,
      limit: 5,
      include: "memberCount",
      relation: "direct",
      sortDir: "asc",
    });
  });

  it("leaves out unset and null params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchMutualWorkspaces());
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ userId: "user-2", relation: null, sortDir: null });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toEqual({});
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchMutualWorkspaces());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current({ userId: "user-2" })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no project or no userId", async () => {
    const noProject = renderHookWithAxios(() => useFetchMutualWorkspaces(), { projectId: "" });
    await expect(noProject.result.current({ userId: "user-2" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(noProject.axiosPrivate.calls("get")).toHaveLength(0);

    const noUser = renderHookWithAxios(() => useFetchMutualWorkspaces());
    await expect(noUser.result.current({ userId: "" })).rejects.toThrow("Please pass a userId");
    expect(noUser.axiosPrivate.calls("get")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useFetchUserSpaces from "./useFetchUserSpaces";
import type { UserSpacesResponse } from "../../interfaces/models/Space";

afterEach(() => {
  resetAxiosMocks();
});

function makeResponse(): UserSpacesResponse {
  return {
    data: [
      {
        space: makeSpace(),
        membership: { membershipId: "membership-1", role: "member", status: "active", joinedAt: "2024-01-01T00:00:00.000Z" },
      },
    ],
    pagination: { page: 1, pageSize: 20, totalPages: 1, totalItems: 1, hasMore: false },
  };
}

describe("useFetchUserSpaces", () => {
  it("fetches the current user's spaces with default params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUserSpaces());

    const response = makeResponse();
    axiosPrivate.mockResponse("get", response);

    let returned: UserSpacesResponse | undefined;
    await act(async () => {
      returned = await result.current();
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/user-spaces");
  });

  it("joins a role array into a comma-separated param", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUserSpaces());

    axiosPrivate.mockResponse("get", makeResponse());

    await act(async () => {
      await result.current({ role: ["admin", "moderator"], all: true });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ role: "admin,moderator", all: true });
  });

  it("sends query, searchFields, sortBy and sortDir, and leaves a blank query out", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUserSpaces());

    axiosPrivate.mockResponse("get", makeResponse());
    axiosPrivate.mockResponse("get", makeResponse());

    await act(async () => {
      await result.current({ query: "des", searchFields: "name", sortBy: "alphabetical", sortDir: "desc" });
    });
    await act(async () => {
      await result.current({ query: "  ", searchFields: "slug", sortBy: "members" });
    });

    const [first, second] = axiosPrivate.calls("get");
    expect(first.config?.params).toMatchObject({
      query: "des",
      searchFields: "name",
      sortBy: "alphabetical",
      sortDir: "desc",
    });
    expect(second.config?.params).toMatchObject({ sortBy: "members" });
    expect(second.config?.params).not.toHaveProperty("query");
    expect(second.config?.params).not.toHaveProperty("searchFields");
  });

  it("passes parentSpaceId through, sends \"none\" as given, and leaves null out", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUserSpaces());

    axiosPrivate.mockResponse("get", makeResponse());
    axiosPrivate.mockResponse("get", makeResponse());
    axiosPrivate.mockResponse("get", makeResponse());
    axiosPrivate.mockResponse("get", makeResponse());

    await act(async () => {
      await result.current({ parentSpaceId: "space-1" });
    });
    await act(async () => {
      await result.current({ parentSpaceId: "none" });
    });
    await act(async () => {
      await result.current({ parentSpaceId: null });
    });
    await act(async () => {
      await result.current({});
    });

    const [byId, none, nulled, omitted] = axiosPrivate.calls("get");
    expect(byId.config?.params).toMatchObject({ parentSpaceId: "space-1" });
    expect(none.config?.params).toMatchObject({ parentSpaceId: "none" });
    expect(nulled.config?.params).not.toHaveProperty("parentSpaceId");
    expect(omitted.config?.params).not.toHaveProperty("parentSpaceId");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchUserSpaces());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchUserSpaces(),
      { projectId: "" },
    );

    await expect(result.current()).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

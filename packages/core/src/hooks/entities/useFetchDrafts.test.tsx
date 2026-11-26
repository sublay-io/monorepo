import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useFetchDrafts from "./useFetchDrafts";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Entity } from "../../interfaces/models/Entity";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(entities: Entity[]): PaginatedResponse<Entity> {
  return {
    data: entities,
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: entities.length, hasMore: false },
  };
}

describe("useFetchDrafts", () => {
  it("fetches drafts with no params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchDrafts());

    const page = makePage([makeEntity({ isDraft: true })]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Entity> | undefined;
    await act(async () => {
      returned = await result.current();
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/drafts");
  });

  it("passes pagination, source/space filters and include through as params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchDrafts());

    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({
        page: 2,
        limit: 5,
        sourceId: "source-1",
        spaceId: "space-1",
        include: ["user", "space"],
      });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({
      page: 2,
      limit: 5,
      sourceId: "source-1",
      spaceId: "space-1",
      include: "user,space",
    });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchDrafts());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      status: 500,
    });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchDrafts(), {
      projectId: "",
    });

    await expect(result.current()).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

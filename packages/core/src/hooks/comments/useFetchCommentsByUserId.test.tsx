import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchCommentsByUserId from "./useFetchCommentsByUserId";
import useFetchCommentsByUserIdWrapper from "./useFetchCommentsByUserIdWrapper";
import { makeComment } from "./testHelpers";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(
  comments: Comment[],
  nextCursor: string | null,
): CursorPaginatedResponse<Comment> {
  return { data: comments, pagination: { nextCursor, hasMore: nextCursor !== null } };
}

describe("useFetchCommentsByUserId", () => {
  it("gets /users/:userId/comments with every history param", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchCommentsByUserId());
    const page = makePage([makeComment()], "n");
    axiosPrivate.mockResponse("get", page);

    let returned: CursorPaginatedResponse<Comment> | undefined;
    await act(async () => {
      returned = await result.current({
        userId: "user-1",
        entityId: "entity-1",
        sourceId: "source-1",
        blockedFilter: "include-outbound-blocked",
        sortBy: "top",
        sortDir: "asc",
        sortByReaction: "funny",
        limit: 5,
        cursor: "c",
        include: ["user", "entity", "parent"],
        spaceReputation: { spaceId: "s1" },
      });
    });

    expect(returned).toEqual(page);
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/users/user-1/comments");
    expect(call.config?.params).toEqual({
      entityId: "entity-1",
      sourceId: "source-1",
      blockedFilter: "include-outbound-blocked",
      sortBy: "top",
      sortDir: "asc",
      sortByReaction: "funny",
      limit: 5,
      cursor: "c",
      include: "user,entity,parent",
      spaceReputationId: "s1",
    });
    expect(call.config?.params).not.toHaveProperty("userId");
    expect(call.config?.params).not.toHaveProperty("page");
  });

  it("throws before a request without a userId or project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchCommentsByUserId());
    await expect(result.current({ userId: "" })).rejects.toThrow("No user ID passed");

    const noProject = renderHookWithAxios(() => useFetchCommentsByUserId(), { projectId: "" });
    await expect(noProject.result.current({ userId: "u" })).rejects.toThrow(
      "No project specified",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

describe("useFetchCommentsByUserIdWrapper", () => {
  it("lists a user's comments, continues from the cursor, and tracks state", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useFetchCommentsByUserIdWrapper({
          userId: "user-1",
          include: "entity",
          blockedFilter: "exclude",
        }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeComment({ id: "a" })], "c2")),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments.map((c) => c.id)).toEqual(["a"]);
    expect(result.current.hasMore).toBe(true);
    expect(result.current.error).toBeNull();

    axiosPrivate.mockResponse("get", makePage([makeComment({ id: "b" })], null));
    await act(async () => {
      await result.current.loadMore();
    });
    expect(result.current.comments.map((c) => c.id)).toEqual(["a", "b"]);
    expect(result.current.hasMore).toBe(false);

    const calls = axiosPrivate.calls("get");
    expect(calls[0].url).toBe("/test-project/users/user-1/comments");
    expect(calls[0].config?.params).toEqual({
      include: "entity",
      blockedFilter: "exclude",
      limit: 10,
      sortBy: "createdAt",
      sortDir: "desc",
    });
    expect(calls[1].config?.params).toMatchObject({ cursor: "c2" });

    // No-op once there's nothing more.
    await act(async () => {
      await result.current.loadMore();
    });
    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("re-fetches from the start when the sort reaction changes under top", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchCommentsByUserIdWrapper({ userId: "user-1", defaultSortBy: "top" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([], null)),
      },
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(axiosPrivate.calls("get")[0].config?.params).not.toHaveProperty("sortByReaction");

    axiosPrivate.mockResponse("get", makePage([], null));
    act(() => {
      result.current.setSortByReaction("love");
    });
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({
      sortBy: "top",
      sortByReaction: "love",
    });
  });

  it("does not fetch without a userId", async () => {
    const { axiosPrivate } = renderHookWithAxios(() =>
      useFetchCommentsByUserIdWrapper({ userId: null }),
    );
    await new Promise((r) => setTimeout(r, 10));
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

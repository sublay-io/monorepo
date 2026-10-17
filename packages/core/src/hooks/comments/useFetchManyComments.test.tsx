import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchManyComments, {
  type FetchManyCommentsProps,
} from "./useFetchManyComments";
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
  return {
    data: comments,
    pagination: { nextCursor, hasMore: nextCursor !== null },
  };
}

describe("useFetchManyComments", () => {
  it("fetches a thread page and returns the cursor envelope", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    const page = makePage([makeComment()], "cursor-2");
    axiosPrivate.mockResponse("get", page);

    let returned: CursorPaginatedResponse<Comment> | undefined;
    await act(async () => {
      returned = await result.current({ entityId: "entity-1", sortBy: "createdAt" });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/comments");
    expect(call.config?.params).toEqual({
      entityId: "entity-1",
      sortBy: "createdAt",
    });
  });

  it("forwards cursor, sort trio, nesting params and a joined include", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    axiosPrivate.mockResponse("get", makePage([], null));

    await act(async () => {
      await result.current({
        parentId: "comment-1",
        cursor: "abc",
        limit: 20,
        sortBy: "top",
        sortDir: "asc",
        sortByReaction: "love",
        replyDepth: 2,
        replyLimit: 3,
        replySortBy: "createdAt",
        replySortDir: "desc",
        include: ["user", "grants"],
      });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toEqual({
      parentId: "comment-1",
      cursor: "abc",
      limit: 20,
      sortBy: "top",
      sortDir: "asc",
      sortByReaction: "love",
      replyDepth: 2,
      replyLimit: 3,
      replySortBy: "createdAt",
      replySortDir: "desc",
      include: "user,grants",
    });
  });

  it("never sends sortDir / replySortDir with controversial (it ranks one way only)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());
    axiosPrivate.mockResponse("get", { data: [], pagination: { limit: 10, hasMore: false, nextCursor: null } });
    await act(async () => {
      await result.current({
        entityId: "entity-1",
        sortBy: "controversial",
        sortDir: "asc",
        replyDepth: 1,
        replySortDir: "asc",
      } as never);
    });
    const params = axiosPrivate.calls("get")[0].config?.params;
    expect(params).toMatchObject({ sortBy: "controversial" });
    expect(params).not.toHaveProperty("sortDir");
    expect(params).not.toHaveProperty("replySortDir");
  });

  it("never sends params the thread endpoint rejects, even if passed untyped", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    axiosPrivate.mockResponse("get", makePage([], null));

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        page: 2,
        userId: "user-1",
        sourceId: "source-1",
        blockedFilter: "include-outbound-blocked",
      } as unknown as FetchManyCommentsProps);
    });

    const params = axiosPrivate.calls("get")[0].config?.params ?? {};
    for (const key of ["page", "userId", "sourceId", "blockedFilter"]) {
      expect(params).not.toHaveProperty(key);
    }
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current({ entityId: "entity-1" })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request without an entityId or parentId", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    await expect(
      result.current({} as unknown as FetchManyCommentsProps),
    ).rejects.toThrow("requires an entityId or a parentId");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when limit is 0", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyComments());

    await expect(result.current({ entityId: "entity-1", limit: 0 })).rejects.toThrow(
      "Can't fetch with limit 0",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyComments(),
      { projectId: "" },
    );

    await expect(result.current({ entityId: "entity-1" })).rejects.toThrow(
      "No project specified",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

// One of entityId (a thread) or parentId (replies, alone), never neither or
// both, alongside the one-way sort rule — checked when this file compiles.
describe("FetchManyCommentsProps", () => {
  it("takes entityId or parentId, with any sort, including one held in state", () => {
    const pick = (sortBy: "createdAt" | "top" | "controversial", isReply: boolean) => {
      const thread: FetchManyCommentsProps = { entityId: "e", sortBy };
      const replies: FetchManyCommentsProps = { parentId: "p", sortBy };
      const either: FetchManyCommentsProps = {
        ...(isReply ? { parentId: "p" } : { entityId: "e" }),
        sortBy,
      };
      return [thread, replies, either];
    };
    const threadDir: FetchManyCommentsProps = { entityId: "e", sortBy: "top", sortDir: "asc" };
    const repliesDir: FetchManyCommentsProps = { parentId: "p", sortDir: "asc" };
    // @ts-expect-error — neither id
    const neither: FetchManyCommentsProps = { sortBy: "createdAt" };
    // @ts-expect-error — not both: replies take parentId alone
    const both: FetchManyCommentsProps = { entityId: "e", parentId: "p" };
    // @ts-expect-error — no sortDir with controversial (thread)
    const badThread: FetchManyCommentsProps = { entityId: "e", sortBy: "controversial", sortDir: "asc" };
    // @ts-expect-error — no sortDir with controversial (replies)
    const badReplies: FetchManyCommentsProps = { parentId: "p", sortBy: "controversial", sortDir: "asc" };
    expect([
      ...pick("controversial", true),
      threadDir,
      repliesDir,
      neither,
      both,
      badThread,
      badReplies,
    ]).toHaveLength(9);
  });
});

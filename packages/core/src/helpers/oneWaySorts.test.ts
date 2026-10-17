import { describe, it, expect } from "vitest";
import { isOneWaySort, oneWaySortFields, sendableSortDir } from "./oneWaySorts";
import { resolveReplySort } from "./commentThreadConfig";
import type { FetchManyCommentsProps } from "../hooks/comments/useFetchManyComments";
import type { FetchCommentsByUserIdProps } from "../hooks/comments/useFetchCommentsByUserId";

describe("one-way sorts (hot, controversial)", () => {
  it("drops sortDir for hot / controversial only", () => {
    expect(isOneWaySort("hot")).toBe(true);
    expect(isOneWaySort("controversial")).toBe(true);
    expect(isOneWaySort("top")).toBe(false);
    expect(sendableSortDir("hot", "asc")).toBeUndefined();
    expect(sendableSortDir("controversial", "desc")).toBeUndefined();
    expect(sendableSortDir("top", "asc")).toBe("asc");
    expect(sendableSortDir(undefined, "asc")).toBe("asc");
    expect(oneWaySortFields("controversial", "asc")).toEqual({ sortBy: "controversial" });
    expect(oneWaySortFields("createdAt", "asc")).toEqual({ sortBy: "createdAt", sortDir: "asc" });
  });

  it("a controversial reply level always ranks most controversial first", () => {
    expect(
      resolveReplySort(
        { sortBy: "createdAt", sortDir: "asc", sortByReaction: undefined },
        { replySortBy: "controversial" },
      ),
    ).toEqual({ sortBy: "controversial", sortDir: "desc", sortByReaction: undefined });
  });

  it("under a controversial section, replies inherit desc whatever direction is stored", () => {
    expect(
      resolveReplySort(
        { sortBy: "controversial", sortDir: "asc", sortByReaction: undefined },
        { replySortBy: "createdAt" },
      ),
    ).toEqual({ sortBy: "createdAt", sortDir: "desc", sortByReaction: undefined });
    // An explicit replySortDir still wins.
    expect(
      resolveReplySort(
        { sortBy: "controversial", sortDir: "asc", sortByReaction: undefined },
        { replySortBy: "createdAt", replySortDir: "asc" },
      ).sortDir,
    ).toBe("asc");
  });

  it("the request types refuse sortDir with a one-way sort", () => {
    const ok: FetchManyCommentsProps = { entityId: "e", sortBy: "top", sortDir: "asc" };
    const okOneWay: FetchManyCommentsProps = { entityId: "e", sortBy: "controversial" };
    // @ts-expect-error — sortDir is not accepted with sortBy "controversial"
    const bad: FetchManyCommentsProps = { entityId: "e", sortBy: "controversial", sortDir: "asc" };
    // @ts-expect-error — same for a user's comment history
    const badHistory: FetchCommentsByUserIdProps = { userId: "u", sortBy: "controversial", sortDir: "desc" };
    // A sort held in state (any of the sorts, no sortDir) is accepted.
    const fromState = (sortBy: "createdAt" | "top" | "controversial") => {
      const thread: FetchManyCommentsProps = { entityId: "e", sortBy };
      const replies: FetchManyCommentsProps = { parentId: "p", sortBy };
      const history: FetchCommentsByUserIdProps = { userId: "u", sortBy };
      // With a direction too: through oneWaySortFields.
      const withDir: FetchManyCommentsProps = { entityId: "e", ...oneWaySortFields(sortBy, "asc" as const) };
      return [thread, replies, history, withDir];
    };
    expect(fromState("top")).toHaveLength(4);
    expect([ok, okOneWay, bad, badHistory]).toHaveLength(4);
  });
});

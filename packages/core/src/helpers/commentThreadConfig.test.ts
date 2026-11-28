import { describe, it, expect } from "vitest";
import {
  commentWorstCaseRows,
  fitReplyDepthToBudget,
  resolveReplySort,
  sendableReplySortByReaction,
} from "./commentThreadConfig";

describe("resolveReplySort (mirrors the server's resolveCommentReplySort)", () => {
  it("the reply levels default to the section's sort and direction", () => {
    expect(
      resolveReplySort(
        { sortBy: "createdAt", sortDir: "asc", sortByReaction: undefined },
        { replySortBy: "top" },
      ),
    ).toEqual({ sortBy: "top", sortDir: "asc", sortByReaction: undefined });
    expect(
      resolveReplySort({ sortBy: "createdAt", sortDir: "asc", sortByReaction: undefined }, {}),
    ).toEqual({ sortBy: "createdAt", sortDir: "asc", sortByReaction: undefined });
  });

  it("inherits the reaction only when both levels sort by top", () => {
    expect(
      resolveReplySort({ sortBy: "top", sortDir: "desc", sortByReaction: "love" }, {}),
    ).toEqual({ sortBy: "top", sortDir: "desc", sortByReaction: "love" });
    expect(
      resolveReplySort(
        { sortBy: "createdAt", sortDir: "desc", sortByReaction: undefined },
        { replySortBy: "top" },
      ).sortByReaction,
    ).toBeUndefined();
  });
});

describe("sendableReplySortByReaction", () => {
  it("is only sent when the effective reply sort is top", () => {
    expect(sendableReplySortByReaction(undefined, "top", "love")).toBe("love");
    expect(sendableReplySortByReaction(undefined, "createdAt", "love")).toBeUndefined();
    expect(sendableReplySortByReaction("top", "createdAt", "love")).toBe("love");
    expect(sendableReplySortByReaction("createdAt", "top", "love")).toBeUndefined();
  });
});

describe("budget", () => {
  it("matches the server formula after clamping", () => {
    expect(commentWorstCaseRows(10, 5, 2)).toBe(630);
    expect(commentWorstCaseRows(10, 2, 3)).toBe(130);
    expect(fitReplyDepthToBudget(10, 5, 3)).toBe(3);
  });
});

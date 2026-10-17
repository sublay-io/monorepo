import {
  CommentReplySortByOptions,
  CommentsSortByOptions,
} from "../interfaces/CommentsSortByOptions";
import { ReactionType } from "../interfaces/models/Reaction";
import { isDevelopment } from "../utils/env";

/**
 * Mirrors of the server's thread limits (plan §3.2, D11). The worst-case
 * budget is the one real limit; `replyDepth` has its own cap only because each
 * level is one more query.
 */
export const COMMENT_REPLY_BUDGET = 500;
export const MAX_COMMENT_REPLY_DEPTH = 5;
export const MAX_COMMENT_LIMIT = 100;
export const DEFAULT_COMMENT_REPLY_LIMIT = 3;

/**
 * The most comments a thread request can return — the server's formula,
 * `limit × (1 + replyLimit + … + replyLimit^replyDepth)`, on the values
 * **after** the server clamps `limit` / `replyLimit` to 100.
 */
export function commentWorstCaseRows(
  limit: number,
  replyDepth: number,
  replyLimit: number,
): number {
  const clampedLimit = Math.min(limit, MAX_COMMENT_LIMIT);
  const clampedReplyLimit = Math.min(replyLimit, MAX_COMMENT_LIMIT);
  let perComment = 0;
  let levelSize = 1;
  for (let level = 0; level <= replyDepth; level++) {
    perComment += levelSize;
    levelSize *= clampedReplyLimit;
  }
  return clampedLimit * perComment;
}

/**
 * The deepest `replyDepth` (≤ `depth`) whose request fits the budget. Depth 0
 * always fits (`limit` alone is capped at 100).
 */
export function fitReplyDepthToBudget(
  limit: number,
  depth: number,
  replyLimit: number,
): number {
  let fitted = Math.min(depth, MAX_COMMENT_REPLY_DEPTH);
  while (fitted > 0 && commentWorstCaseRows(limit, fitted, replyLimit) > COMMENT_REPLY_BUDGET) {
    fitted--;
  }
  return fitted;
}

export interface CommentSortTrio {
  sortBy: CommentsSortByOptions;
  sortDir: "asc" | "desc";
  /** Set only when `sortBy` is `"top"`. */
  sortByReaction: ReactionType | undefined;
}

/**
 * The sort of the nested levels, resolved exactly the way the server resolves
 * it: each of `replySortBy` / `replySortDir` defaults to the section's own; the
 * reaction applies only to `top` and defaults to the section's reaction when the
 * section also sorts by `top`, else the server default. `controversial` ranks
 * one way only, so its direction is always `desc`.
 */
export function resolveReplySort(
  section: CommentSortTrio,
  reply: {
    replySortBy?: CommentReplySortByOptions;
    replySortDir?: "asc" | "desc";
    replySortByReaction?: ReactionType;
  },
): CommentSortTrio {
  const sortBy = reply.replySortBy ?? section.sortBy;
  const sortDir =
    sortBy === "controversial" ? "desc" : (reply.replySortDir ?? section.sortDir);
  const sortByReaction =
    sortBy === "top"
      ? (reply.replySortByReaction ??
        (section.sortBy === "top" ? section.sortByReaction : undefined))
      : undefined;
  return { sortBy, sortDir, sortByReaction };
}

/** True in development builds (web bundlers' NODE_ENV, or React Native's `__DEV__`). */
export function isDevBuild(): boolean {
  if ((globalThis as { __DEV__?: boolean }).__DEV__ === true) return true;
  return isDevelopment();
}

/**
 * `replySortByReaction` as it may be sent: the server only accepts it when the
 * effective reply sort (`replySortBy`, defaulting to the request's `sortBy`)
 * is `top`, and rejects the request otherwise.
 */
export function sendableReplySortByReaction(
  replySortBy: CommentReplySortByOptions | undefined,
  sortBy: CommentsSortByOptions | undefined,
  replySortByReaction: ReactionType | undefined,
): ReactionType | undefined {
  return (replySortBy ?? sortBy) === "top" ? replySortByReaction : undefined;
}

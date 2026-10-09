import { ReactionType } from "../interfaces/models/Reaction";

/** Whether an entity `include` (string or array) asks for `topComments`. Case-insensitive, like the server. */
export function includesTopComments(
  include: string | readonly string[] | null | undefined,
): boolean {
  if (!include) return false;
  const tokens = Array.isArray(include) ? include : String(include).split(",");
  return tokens.some((token) => token.trim().toLowerCase() === "topcomments");
}

/**
 * `topCommentsLimit` / `topCommentsSortByReaction` as they may be sent: the
 * server rejects either one without `include=topComments` (400), so they're
 * dropped when the include doesn't ask for top comments — the same way
 * `sortByReaction` is dropped when `sortBy` isn't `top`.
 */
export function sendableTopCommentsParams(
  include: string | readonly string[] | null | undefined,
  topCommentsLimit: number | null | undefined,
  topCommentsSortByReaction: ReactionType | null | undefined,
): { topCommentsLimit?: number; topCommentsSortByReaction?: ReactionType } {
  if (!includesTopComments(include)) return {};
  return {
    ...(topCommentsLimit != null ? { topCommentsLimit } : {}),
    ...(topCommentsSortByReaction ? { topCommentsSortByReaction } : {}),
  };
}

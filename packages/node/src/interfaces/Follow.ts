import { User } from "./User";

/**
 * A follow, seen from the caller: `{ id, user, createdAt }`. The same shape on
 * every route that returns a follow (follow create, follow status, followers
 * and following lists).
 *
 * - `id` is the follow's own id (what `follows.deleteFollow` takes).
 * - `user` is the other user: the followed user on a follow create, on the
 *   follow status and in a following list; the follower in a followers list.
 * - `createdAt` is when the follow was made.
 */
export interface FollowRow {
  id: string;
  user: User;
  createdAt: string;
}

/**
 * Does the acting user follow the target? `follow` (with `user` = the target)
 * is present only when they do.
 */
export type FollowStatus =
  | { isFollowing: false }
  | { isFollowing: true; follow: FollowRow };

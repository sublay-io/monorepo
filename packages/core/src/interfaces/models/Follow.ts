import { User } from "./User";

/**
 * One follow, as every follow route returns it (create, status check,
 * followers and following lists).
 *
 * - `id` is the follow's own id (what `DELETE /follows/:followId` takes).
 * - `user` is the *other* user, seen from the caller: the followed user on a
 *   follow create, a status check or a following list; the follower on a
 *   followers list.
 * - `createdAt` is when the follow was made.
 */
export interface FollowRow {
  id: string;
  user: User;
  createdAt: string;
}

/**
 * `GET /users/:userId/follow`: does the acting user follow `:userId`? The
 * follow row (`user` = `:userId`) is included when they do.
 */
export type FollowStatus =
  | { isFollowing: false }
  | { isFollowing: true; follow: FollowRow };

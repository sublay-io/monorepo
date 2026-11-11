import { User } from "./User";

/**
 * One block, as every block route returns it (create, status check, the
 * acting user's block list). `user` is the blocked user; `createdAt` is when
 * the block was made.
 */
export interface BlockRow {
  id: string;
  user: User;
  createdAt: string;
}

/**
 * `GET /users/:userId/block`: does the acting user block `:userId`? The block
 * row (`user` = `:userId`) is included when they do. This is the acting user's
 * outbound state only — it never reveals whether `:userId` blocked them.
 */
export type BlockStatus =
  | { isBlocking: false }
  | { isBlocking: true; block: BlockRow };

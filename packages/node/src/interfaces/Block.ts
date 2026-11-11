import { User } from "./User";

/**
 * A block, seen from the blocker: `{ id, user, createdAt }`, where `user` is
 * the blocked user. The same shape on the block create, the block status and
 * the block list.
 */
export interface BlockRow {
  id: string;
  user: User | null;
  createdAt: string;
}

/**
 * Outbound-only block status: does the acting user block the target? `block`
 * (with `user` = the target) is present only when they do. It never says
 * whether the target blocks the acting user.
 */
export type BlockStatusResponse =
  | { isBlocking: false }
  | { isBlocking: true; block: BlockRow };

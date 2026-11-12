import { User } from "./User";

export type ConversationMemberRole = "admin" | "member";

export interface ConversationMember {
  id: string;
  projectId: string;
  conversationId: string;
  userId: string;
  role: ConversationMemberRole | null;
  lastReadAt: string | null;
  // Personal mute state, present ONLY on the viewer's own row (omitted for other
  // members). For a timed mute this is a real ISO timestamp; when muted
  // "forever" this is `null` and `mutedForever` is `true` (the storage sentinel
  // is never exposed as a magic date). `null` + `mutedForever: false` = not muted.
  mutedUntil?: string | null;
  // Explicit "forever" signal for the viewer's own row (self-serialized). Absent
  // on other members' rows.
  mutedForever?: boolean;
  isActive: boolean;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  // Populated
  user?: User;
}

/**
 * `GET /chat/conversations/:conversationId/members/me`. Fields that describe a
 * membership the caller doesn't have are left out, never sent as null: `role`,
 * `lastReadAt`, `mutedForever` and `mutedUntil` are present only when
 * `isMember` is true; `leftAt` only when the caller left or was removed (an
 * inactive membership row). A caller with no row at all (a space chat they
 * haven't opened yet) gets `{ isMember: false }`.
 */
export interface CheckMyConversationMembershipResponse {
  isMember: boolean;
  role?: ConversationMemberRole | null;
  lastReadAt?: string | null;
  /** `true` when muted with no end; `mutedUntil` is then `null`. */
  mutedForever?: boolean;
  /** End of a timed mute; `null` when not muted or muted forever. */
  mutedUntil?: string | null;
  leftAt?: string | null;
}

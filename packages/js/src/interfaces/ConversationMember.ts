export type ConversationMemberRole = "admin" | "member";

export interface ConversationMember {
  id: string;
  conversationId: string;
  userId: string;
  role: ConversationMemberRole | null;
  lastReadAt: string | null;
  // Personal mute state, present ONLY on the viewer's own row (omitted for
  // other members). Timed mute → real ISO timestamp; muted "forever" →
  // `mutedUntil: null` with `mutedForever: true` (the storage sentinel is never
  // exposed as a magic date). `null` + `mutedForever: false` = not muted.
  mutedUntil?: string | null;
  // Explicit "forever" signal for the viewer's own row. Absent on others' rows.
  mutedForever?: boolean;
  isActive: boolean;
  leftAt: string | null;
  createdAt: string;
  updatedAt: string;
  // The member's user, on listMembers. `spaceReputation` is present when
  // requested.
  user?: {
    id: string;
    name: string | null;
    username: string | null;
    avatar: string | null;
    metadata: Record<string, any>;
    reputation: number;
    spaceReputation?: number;
  };
}

/**
 * `GET /chat/conversations/:conversationId/members/me`: the caller's own
 * membership in a conversation. A field that describes a relationship the
 * caller doesn't have is omitted, not null:
 * - active member: `{ isMember: true, role, lastReadAt, mutedForever, mutedUntil }`
 * - left or removed: `{ isMember: false, leftAt }`
 * - never a member (a space chat not opened yet): `{ isMember: false }`
 */
export interface CheckMyConversationMembershipResponse {
  isMember: boolean;
  /** Present when `isMember` is true. */
  role?: ConversationMemberRole | null;
  /** Present when `isMember` is true. */
  lastReadAt?: string | null;
  /** Present when `isMember` is true. */
  mutedForever?: boolean;
  /** Present when `isMember` is true. A timed mute's ISO end; `null` when not
   * muted or muted forever (see `mutedForever`). */
  mutedUntil?: string | null;
  /** Present when the caller left or was removed. */
  leftAt?: string | null;
}

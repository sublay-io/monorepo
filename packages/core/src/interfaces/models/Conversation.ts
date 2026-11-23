import { File } from "./File";
import { GifData } from "./Comment";
import { ChatMessage } from "./ChatMessage";
import { ConversationMember } from "./ConversationMember";
import { User, UserSummary } from "./User";

/** A conversation's type. Also the values the conversation list's `types` filter accepts. */
export type ConversationType = "direct" | "group" | "space";

export interface Conversation {
  id: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  spaceId: string | null;
  directKey: string | null; // Set on direct conversations only: identifies the pair of members
  createdById: string | null;
  avatarFileId: string | null;
  lastMessageAt: string | null;
  // Null for DMs and groups; 'members' | 'team' for space chats ('team' = the space's admins and moderators)
  postingPermission: "members" | "team" | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  memberCount?: number; // Active members. On getConversation and getSpaceConversation
  // The requesting user's own member row, on getConversation and
  // getSpaceConversation; null when they have none
  currentMember?: ConversationMember | null;
  avatarFile?: File | null; // On updateConversation, when the files-images bundle is installed
}

/**
 * A conversation list row's last message: a preview subset of the message.
 * `content` is cut to 100 characters, and there are no mentions, quotes or
 * reactions. A deleted or removed last message is its placeholder.
 */
export interface ConversationPreviewLastMessage {
  id: string;
  conversationId: string;
  content: string | null;
  gif: GifData | null;
  userId: string | null;
  moderationStatus: ChatMessage["moderationStatus"];
  userDeletedAt: string | null;
  createdAt: string;
  files: File[]; // Empty on a placeholder and without the files-images bundle
  // The sender, on `group` and `space` rows only (a DM's counterparty is in
  // `otherMembers`); null on `direct` rows and with a null `userId`
  user: Omit<UserSummary, "spaceReputation"> | null;
}

export interface ConversationPreview
  extends Omit<Conversation, "memberCount" | "currentMember" | "avatarFile"> {
  unreadCount: number;
  memberCount: number; // Active members
  // The requesting user's mute state: a timed mute's ISO end, or null when not
  // muted or muted forever (see `mutedForever`)
  mutedUntil: string | null;
  mutedForever: boolean;
  lastMessage: ConversationPreviewLastMessage | null;
  // Up to 5 active members other than the requester, with public user fields
  // (id, name, username, avatar). Populated for `direct`/`group` conversations
  // (a DM/group has no `name`, so the counterparty supplies the title/avatar);
  // capped at 5 (use `memberCount` for the group total), empty for `space`.
  otherMembers: Pick<User, "id" | "name" | "username" | "avatar">[];
}

import { File } from "./File";
import { ChatMessage } from "./ChatMessage";
import { ConversationMember } from "./ConversationMember";
import { User } from "./User";

/** A conversation's type. Also the values the conversation list's `types` filter accepts. */
export type ConversationType = "direct" | "group" | "space";

export interface Conversation {
  id: string;
  projectId: string;
  type: ConversationType;
  name: string | null;
  description: string | null;
  spaceId: string | null;
  createdById: string | null;
  avatarFileId: string | null;
  lastMessageAt: string | null;
  // Null for DMs and groups; 'members' | 'admins' for space chats
  postingPermission: "members" | "admins" | null;
  metadata: Record<string, any>;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  memberCount?: number;
  // The requesting user's own ConversationMember row — used to bootstrap lastReadAt and role
  currentMember?: ConversationMember;
  avatarFile?: File;
}

export interface ConversationPreview extends Conversation {
  unreadCount: number;
  // Truncated to 100 chars by the server for list performance
  lastMessage: ChatMessage | null;
  // Up to 5 active members other than the requester, with public user fields
  // (id, name, username, avatar). Populated for `direct` and `group`
  // conversations only — a DM/group has no `name`, so the counterparty is how
  // the list renders a title/avatar. Capped at 5 (use `memberCount` for the
  // group total); empty array for `space` chats.
  otherMembers?: Pick<User, "id" | "name" | "username" | "avatar">[];
}

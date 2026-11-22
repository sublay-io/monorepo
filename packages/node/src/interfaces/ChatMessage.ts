import { GrantSummary } from "./ReputationGrant";
import { GifData } from "./Comment";
import { File } from "./File";
import { Mention } from "./Mention";
import { UserSummary } from "./User";

export interface ChatMessage {
  id: string;
  conversationId: string;
  spaceId: string | null; // The conversation's space, for a space chat message
  userId: string | null; // null when the sender's account has been deleted, and on a removed message for everyone but its author
  content: string | null;
  gif: GifData | null;
  mentions: Mention[];
  // Present when the files-images bundle is installed: always on a single
  // fetch, send and edit; on the list only with `include: "files"`.
  files?: File[];
  metadata: Record<string, any> | null; // null on a deleted message, and on a removed one for everyone but its author
  parentMessageId: string | null;
  quotedMessageId: string | null;
  threadReplyCount: number;
  reactionCounts: Record<string, number>; // emoji → count
  userReactions: string[];               // emojis the requesting user reacted with
  /**
   * Reputation-grant summary. Opt-in — present exactly when the read requested
   * `include=grants`. Once requested the server always returns the object,
   * zero-filled rather than omitted, on projects with no grants and on projects
   * without the reputation bundle alike.
   */
  grants?: GrantSummary;
  editedAt: string | null;
  userDeletedAt: string | null;
  moderationStatus: "removed" | null;
  moderatedAt: string | null;
  moderatedById: string | null;
  moderatedByType: "client" | "user" | null;
  moderationReason: string | null;
  createdAt: string;
  updatedAt: string;

  // Populated fields
  user: UserSummary | null; // null alongside a null `userId`
  quotedMessage: QuotedChatMessage | null; // null when the message quotes nothing
}

/**
 * The message a chat message quotes: its own fields and sender, without
 * reactions, files, grants or a quote of its own. A deleted or removed quoted
 * message comes back as its placeholder.
 */
export type QuotedChatMessage = Omit<
  ChatMessage,
  "files" | "reactionCounts" | "userReactions" | "grants" | "quotedMessage"
>;

/**
 * A chat message as `sendMessage` and `editMessage` return it: the message
 * without the reaction data and grant summary the reads attach.
 */
export type SentChatMessage = Omit<
  ChatMessage,
  "reactionCounts" | "userReactions" | "grants"
>;

/** `include` values the message list accepts. */
export type ChatMessageListInclude = "files" | "grants";
export type ChatMessageListIncludeArray = ChatMessageListInclude[];
export type ChatMessageListIncludeParam =
  | ChatMessageListInclude
  | ChatMessageListIncludeArray;

/** `include` values the single-message fetch accepts (its files always come back). */
export type ChatMessageInclude = "grants";
export type ChatMessageIncludeArray = ChatMessageInclude[];
export type ChatMessageIncludeParam =
  | ChatMessageInclude
  | ChatMessageIncludeArray;

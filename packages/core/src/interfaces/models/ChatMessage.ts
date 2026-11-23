import { GrantSummary } from "./ReputationGrant";
import { GifData } from "./Comment";
import { File } from "./File";
import { Mention } from "./Mention";
import { UserSummary } from "./User";

export interface ChatMessage {
  id: string;
  // Locally-generated UUID echoed by the server in the REST response and socket payload.
  // Never stored in the DB. Used for optimistic deduplication (matching temp entries to confirmed ones).
  localId?: string;
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
  // Reputation-grant summary. Opt-in on the READ — the server populates it
  // exactly when the hook's `include` contains "grants", and once
  // requested it always returns the object, zero-filled
  // (`{ total: 0, count: 0, viewerTotal: 0 }`) rather than omitted, on projects
  // with no grants and on projects without the reputation bundle alike. So a
  // present-but-zero summary never means "this project has no grants".
  //
  // Presence is NOT a record of what the read asked for, though: `chatSlice`'s
  // `updateGrants` writes this field on every loaded copy of the message when a
  // `message:grant` socket event arrives, whether or not the fetch that loaded
  // it opted in. A message read without "grants" therefore GAINS the
  // field the moment someone grants on it while the conversation is open.
  //
  // That is deliberate, and preserving the opt-in state instead would be worse:
  // the reducer cannot tell an opted-out message from one that simply has no
  // grants yet, so honouring the axis would mean dropping live grants on the
  // floor for the exact conversations that are watching for them.
  //
  // What `undefined` reliably means is therefore "nobody asked AND no grant has
  // landed since" — treat it as "unknown", not as "zero".
  grants?: GrantSummary;
  editedAt: string | null;
  userDeletedAt: string | null;
  // The column also allows "approved", but nothing sets it on a chat message.
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

  // Client-only flag — never comes from the server.
  // Set to true by failOptimisticMessage when a send request fails.
  sendFailed?: boolean;
}

/**
 * The message a chat message quotes: its own fields and sender, without
 * reactions, files, grants or a quote of its own. A deleted or removed quoted
 * message comes back as its placeholder.
 */
export type QuotedChatMessage = Omit<
  ChatMessage,
  | "files"
  | "reactionCounts"
  | "userReactions"
  | "grants"
  | "quotedMessage"
  | "localId"
  | "sendFailed"
>;

/**
 * A chat message as `sendMessage` and `editMessage` return it: the message
 * without the reaction data and grant summary the reads attach.
 */
export type SentChatMessage = Omit<
  ChatMessage,
  "reactionCounts" | "userReactions" | "grants" | "localId" | "sendFailed"
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

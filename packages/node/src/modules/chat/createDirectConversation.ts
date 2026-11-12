import { SublayHttpClient } from "../../core/client";
import { Conversation } from "../../interfaces/Conversation";

export interface CreateDirectConversationProps {
  /** The other participant (the target). */
  userId: string;
  /** The acting user initiating the DM. Service key required to name a user. */
  actingUserId: string;
}

export interface CreateDirectConversationResult {
  conversation: Conversation;
  /** `true` when this call created the conversation (HTTP 201), `false` when it already existed (200). */
  created: boolean;
}

/**
 * POST /chat/conversations/direct — return the direct conversation between
 * the acting user and `userId`, or create it when there is none.
 *
 * Resolves to `{ conversation, created }`: `created` is true when the server
 * answered 201.
 */
export async function createDirectConversation(
  client: SublayHttpClient,
  data: CreateDirectConversationProps
): Promise<CreateDirectConversationResult> {
  const response = await client.projectInstance.post<Conversation>(
    "/chat/conversations/direct",
    data
  );
  return { conversation: response.data, created: response.status === 201 };
}

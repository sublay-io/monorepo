import { SublayHttpClient } from "../../core/client";
import { ConversationPreview } from "../../interfaces/Conversation";

export interface ListConversationsProps {
  /** The user whose conversations are listed. Service key required to name a user. */
  actingUserId: string;
  /** Comma-separated conversation types, e.g. "direct,group,space". */
  types?: string;
  /** Cursor for keyset pagination: the `lastMessageAt` of the last item from the previous page. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. */
  cursor?: string;
  /** Tie-breaker cursor: the `createdAt` of the last item from the previous page. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. */
  cursorCreatedAt?: string;
  limit?: number;
}

export interface ListConversationsResponse {
  conversations: ConversationPreview[];
  hasMore: boolean;
}

export async function listConversations(
  client: SublayHttpClient,
  data: ListConversationsProps
): Promise<ListConversationsResponse> {
  const response = await client.projectInstance.get<ListConversationsResponse>(
    "/chat/conversations",
    { params: data }
  );
  return response.data;
}

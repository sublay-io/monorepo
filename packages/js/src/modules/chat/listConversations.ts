import { SublayHttpClient } from "../../core/client";
import {
  ConversationPreview,
  ConversationType,
} from "../../interfaces/Conversation";

export interface ListConversationsProps {
  /** Only conversations of these types, e.g. `["direct", "group"]`. Left out, every type is listed. */
  types?: ConversationType | ConversationType[];
  /** Cursor for keyset pagination: the `lastMessageAt` of the last item from the previous page. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. */
  cursor?: string;
  /** Tie-breaker cursor: the `createdAt` of the last item from the previous page. UTC ISO datetime ending in `Z` (e.g. `date.toISOString()`); an offset is rejected with a 400. */
  cursorCreatedAt?: string;
  /** Default 20, max 50. */
  limit?: number;
}

export interface ListConversationsResponse {
  conversations: ConversationPreview[];
  hasMore: boolean;
}

export async function listConversations(
  client: SublayHttpClient,
  data?: ListConversationsProps
): Promise<ListConversationsResponse> {
  const response = await client.projectInstance.get<ListConversationsResponse>(
    "/chat/conversations",
    {
      params: data && {
        ...data,
        types: Array.isArray(data.types) ? data.types.join(",") : data.types,
      },
    }
  );
  return response.data;
}

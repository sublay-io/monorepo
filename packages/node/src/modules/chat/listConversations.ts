import { SublayHttpClient } from "../../core/client";
import {
  ConversationPreview,
  ConversationType,
} from "../../interfaces/Conversation";
import { CursorPaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface ListConversationsProps {
  /** The user whose conversations are listed. Service key required to name a user. */
  actingUserId: string;
  /** Only conversations of these types, e.g. `["direct", "group"]`. Left out, every type is listed. */
  types?: ConversationType | ConversationType[];
  /**
   * `pagination.nextCursor` from the previous response, passed as returned;
   * omit it (or pass `null`) for the first page. A cursor the server can't
   * read is answered with `400 chat/invalid-cursor`.
   */
  cursor?: string | null;
  limit?: number;
}

export type ListConversationsResponse =
  CursorPaginatedResponse<ConversationPreview>;

function buildParams<T extends ListConversationsProps>(data: T) {
  const { cursor, types, ...rest } = data;
  return {
    ...rest,
    // A `null` cursor (the last page's `nextCursor`) is not sent.
    ...(cursor != null ? { cursor } : {}),
    types: Array.isArray(types) ? types.join(",") : types,
  };
}

export async function listConversations(
  client: SublayHttpClient,
  data: ListConversationsProps
): Promise<ListConversationsResponse> {
  const response = await client.projectInstance.get<ListConversationsResponse>(
    "/chat/conversations",
    {
      params: buildParams(data),
    }
  );
  return response.data;
}

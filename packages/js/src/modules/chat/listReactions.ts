import { SublayHttpClient } from "../../core/client";
import { UserSummary } from "../../interfaces/User";
import { PaginationMetadata } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface ListReactionsProps extends SpaceReputationContextParams {
  conversationId: string;
  messageId: string;
  /** The reaction emoji to list reactors for (required). */
  emoji: string;
  /** Page number (default 1). */
  page?: number;
  /** Page size (default 50, max 100). */
  limit?: number;
}

export interface MessageReaction {
  emoji: string;
  user: UserSummary;
  createdAt: string;
}

export interface ListReactionsResponse {
  data: MessageReaction[];
  pagination: PaginationMetadata;
}

export async function listReactions(
  client: SublayHttpClient,
  data: ListReactionsProps
): Promise<ListReactionsResponse> {
  const {
    conversationId,
    messageId,
    spaceReputation,
    ...rest
  } = data;
  const params = {
    ...rest,
    ...buildSpaceReputationParams({ spaceReputation }),
  };
  const response = await client.projectInstance.get<ListReactionsResponse>(
    `/chat/conversations/${conversationId}/messages/${messageId}/reactions`,
    { params }
  );
  return response.data;
}

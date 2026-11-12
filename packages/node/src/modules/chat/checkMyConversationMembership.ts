import { SublayHttpClient } from "../../core/client";
import { CheckMyConversationMembershipResponse } from "../../interfaces/ConversationMember";

export interface CheckMyConversationMembershipProps {
  conversationId: string;
  /** The user whose membership to check: the request acts as them. Required. */
  actingUserId: string;
}

/**
 * GET /chat/conversations/:conversationId/members/me — the acting user's own
 * membership. Anyone who may not read the conversation gets the same 404 / 403
 * as reading it.
 */
export async function checkMyConversationMembership(
  client: SublayHttpClient,
  data: CheckMyConversationMembershipProps
): Promise<CheckMyConversationMembershipResponse> {
  const { conversationId, actingUserId } = data;
  const response =
    await client.projectInstance.get<CheckMyConversationMembershipResponse>(
      `/chat/conversations/${conversationId}/members/me`,
      { params: { actingUserId } }
    );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { CheckMyConversationMembershipResponse } from "../../interfaces/ConversationMember";

export interface CheckMyConversationMembershipProps {
  conversationId: string;
}

/**
 * GET /chat/conversations/:conversationId/members/me — the signed-in user's
 * own membership. Anyone who may not read the conversation gets the same
 * 404 / 403 as reading it.
 */
export async function checkMyConversationMembership(
  client: SublayHttpClient,
  data: CheckMyConversationMembershipProps
): Promise<CheckMyConversationMembershipResponse> {
  const { conversationId } = data;
  const response =
    await client.projectInstance.get<CheckMyConversationMembershipResponse>(
      `/chat/conversations/${conversationId}/members/me`
    );
  return response.data;
}

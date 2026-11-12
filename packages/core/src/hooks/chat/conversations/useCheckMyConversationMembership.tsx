import { useCallback } from "react";
import useProject from "../../projects/useProject";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import type { CheckMyConversationMembershipResponse } from "../../../interfaces/models/ConversationMember";

export interface CheckMyConversationMembershipProps {
  conversationId: string;
}

/**
 * Read the signed-in user's own membership in a conversation: active members
 * get `{ isMember: true, role, lastReadAt, mutedForever, mutedUntil }`, a user
 * who left or was removed `{ isMember: false, leftAt }`, and a user with no
 * membership yet (a space chat they haven't opened) `{ isMember: false }`.
 * A caller who can't read the conversation gets the same 404 / 403 as reading
 * it.
 */
function useCheckMyConversationMembership(): (
  props: CheckMyConversationMembershipProps
) => Promise<CheckMyConversationMembershipResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const checkMyConversationMembership = useCallback(
    async ({ conversationId }: CheckMyConversationMembershipProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      if (!conversationId) {
        throw new Error("Please pass a conversationId");
      }

      const response = await axios.get<CheckMyConversationMembershipResponse>(
        `/${projectId}/chat/conversations/${conversationId}/members/me`
      );

      return response.data;
    },
    [projectId, axios]
  );

  return checkMyConversationMembership;
}

export default useCheckMyConversationMembership;

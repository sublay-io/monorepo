import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { ConversationPreview } from "../../../interfaces/models/Conversation";
import { SublayError } from "../../../errors/SublayError";

export interface FetchConversationPreviewProps {
  conversationId: string;
}

/**
 * Fetch a single ConversationPreview (unreadCount, otherMembers, truncated
 * lastMessage) for one conversation — the same shape as a `listConversations`
 * item, not the plain `Conversation` shape `useFetchConversation` returns.
 *
 * Used by ChatProvider's live wiring to fetch-and-insert a conversation that
 * isn't in the loaded inbox list (a brand-new conversation, or one paginated
 * out that just received a message).
 */
function useFetchConversationPreview(): (
  props: FetchConversationPreviewProps
) => Promise<ConversationPreview> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchConversationPreview = useCallback(
    async ({
      conversationId,
    }: FetchConversationPreviewProps): Promise<ConversationPreview> => {
      if (!projectId) throw new SublayError("No projectId available.");
      if (!conversationId) throw new SublayError("Please pass a conversationId.");

      const response = await axios.get(
        `/${projectId}/chat/conversations/${conversationId}/preview`
      );
      return response.data as ConversationPreview;
    },
    [projectId, axios]
  );

  return fetchConversationPreview;
}

export default useFetchConversationPreview;

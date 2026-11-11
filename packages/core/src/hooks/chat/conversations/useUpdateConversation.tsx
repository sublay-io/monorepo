import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { Conversation } from "../../../interfaces/models/Conversation";

export interface UpdateConversationParams {
  conversationId: string;
  name?: string;
  description?: string;
  avatarFileId?: string | null;
  postingPermission?: "members" | "team";
}

function useUpdateConversation(): (
  params: UpdateConversationParams
) => Promise<Conversation> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const update = useCallback(
    async ({
      conversationId,
      ...rest
    }: UpdateConversationParams): Promise<Conversation> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!conversationId) throw new Error("Please pass a conversationId.");

      const response = await axios.patch(
        `/${projectId}/chat/conversations/${conversationId}`,
        rest
      );
      return response.data as Conversation;
    },
    [projectId, axios]
  );

  return update;
}

export default useUpdateConversation;

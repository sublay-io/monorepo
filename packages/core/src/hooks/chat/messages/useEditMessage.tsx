import { useCallback } from "react";
import { useSublayDispatch } from "../../../store/hooks";
import { upsertMessage } from "../../../store/slices/chatSlice";
import { SentChatMessage } from "../../../interfaces/models/ChatMessage";
import { GifData } from "../../../interfaces/models/Comment";
import { Mention } from "../../../interfaces/models/Mention";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { SublayError } from "../../../errors/SublayError";

export interface EditMessageParams {
  conversationId: string;
  messageId: string;
  content?: string;
  gif?: GifData | null;
  mentions?: Mention[];
  metadata?: Record<string, any>;
}

function useEditMessage(): (params: EditMessageParams) => Promise<SentChatMessage> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const edit = useCallback(
    async ({
      conversationId,
      messageId,
      content,
      gif,
      mentions,
      metadata,
    }: EditMessageParams): Promise<SentChatMessage> => {
      if (!projectId) throw new SublayError("No projectId available.");

      try {
        const response = await axios.patch(
          `/${projectId}/chat/conversations/${conversationId}/messages/${messageId}`,
          { content, gif, mentions, metadata }
        );
        const updated = response.data as SentChatMessage;
        dispatch(upsertMessage(updated));
        return updated;
      } catch (err) {
        handleError(err, "Failed to edit message");
        throw err;
      }
    },
    [projectId, axios, dispatch]
  );

  return edit;
}

export default useEditMessage;

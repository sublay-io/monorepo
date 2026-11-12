import { useCallback } from "react";
import { useSublayDispatch } from "../../../store/hooks";
import { setConversation } from "../../../store/slices/chatSlice";
import { Conversation } from "../../../interfaces/models/Conversation";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";

export interface CreateDirectConversationProps {
  userId: string;
}

export interface CreateDirectConversationResult {
  conversation: Conversation;
  /** `true` when this call created the conversation (HTTP 201), `false` when it already existed (200). */
  created: boolean;
}

/**
 * Returns the direct conversation with `userId`, creating it when there is
 * none. Resolves to `{ conversation, created }`: `created` is true when the
 * server answered 201.
 */
function useCreateDirectConversation(): (
  props: CreateDirectConversationProps
) => Promise<CreateDirectConversationResult> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const create = useCallback(
    async ({
      userId,
    }: CreateDirectConversationProps): Promise<CreateDirectConversationResult> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!userId) throw new Error("Please pass a userId.");

      try {
        const response = await axios.post(
          `/${projectId}/chat/conversations/direct`,
          { userId }
        );
        const conversation = response.data as Conversation;
        dispatch(setConversation(conversation));
        return { conversation, created: response.status === 201 };
      } catch (err) {
        handleError(err, "Failed to create direct conversation");
        throw err;
      }
    },
    [projectId, axios, dispatch]
  );

  return create;
}

export default useCreateDirectConversation;

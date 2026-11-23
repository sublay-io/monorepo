import { useCallback, useEffect } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import {
  selectConversation,
  selectConversationLoading,
  setConversation,
  setConversationLoading,
} from "../../../store/slices/chatSlice";
import { Conversation } from "../../../interfaces/models/Conversation";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import useFetchConversation from "./useFetchConversation";
import useUpdateConversation from "./useUpdateConversation";
import { UpdateConversationParams } from "./useUpdateConversation";
import useDeleteConversation from "./useDeleteConversation";

export interface UseConversationProps {
  conversationId: string;
}

export interface UseConversationValues {
  conversation: Conversation | null;
  loading: boolean;
  update: (params: Omit<UpdateConversationParams, "conversationId">) => Promise<Conversation | undefined>;
  deleteConversation: () => Promise<void>;
}

function useConversation({
  conversationId,
}: UseConversationProps): UseConversationValues {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();

  const conversation = useSublaySelector(selectConversation(conversationId));
  const loading = useSublaySelector(selectConversationLoading(conversationId));

  const fetchConversation = useFetchConversation();
  const _update = useUpdateConversation();
  const _delete = useDeleteConversation();

  // Fetch the conversation unless it's fully loaded. A copy that came from an
  // inbox preview has no `currentMember` key (a fetched one always has it,
  // `null` when there's no row), so it is fetched too — on mount, and again if
  // the key goes away (re-added to the conversation).
  const fullyLoaded = !!conversation && "currentMember" in conversation;
  useEffect(() => {
    if (!projectId || !conversationId || fullyLoaded) return;

    const load = async () => {
      dispatch(setConversationLoading({ conversationId, loading: true }));
      try {
        const fetched = await fetchConversation({ conversationId });
        dispatch(setConversation(fetched));
      } catch (err) {
        handleError(err, "Failed to fetch conversation");
        dispatch(setConversationLoading({ conversationId, loading: false }));
      }
    };

    load();
  }, [projectId, conversationId, fullyLoaded]); // eslint-disable-line react-hooks/exhaustive-deps

  const update = useCallback(
    async (
      params: Omit<UpdateConversationParams, "conversationId">
    ): Promise<Conversation | undefined> => {
      const updated = await _update({ conversationId, ...params });
      if (updated) dispatch(setConversation(updated));
      return updated;
    },
    [_update, conversationId, dispatch]
  );

  const deleteConversation = useCallback(async () => {
    await _delete({ conversationId });
  }, [_delete, conversationId]);

  return { conversation, loading, update, deleteConversation };
}

export default useConversation;

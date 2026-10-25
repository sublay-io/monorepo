import { useCallback } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import {
  addOptimisticMessage,
  upsertMessage,
  failOptimisticMessage,
} from "../../../store/slices/chatSlice";
import { selectUser } from "../../../store/slices/userSlice";
import { selectUser as selectAuthUser } from "../../../store/slices/authSlice";
import { ChatMessage } from "../../../interfaces/models/ChatMessage";
import { GifData } from "../../../interfaces/models/Comment";
import { Mention } from "../../../interfaces/models/Mention";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";

export interface SendMessageParams extends SpaceReputationContextParams {
  content?: string;
  gif?: GifData;
  mentions?: Mention[];
  metadata?: Record<string, any>;
  quotedMessageId?: string | null;
  parentMessageId?: string | null;
  files?: File[];
}

export interface UseSendMessageProps {
  conversationId: string;
}

function useSendMessage({
  conversationId,
}: UseSendMessageProps): (params: SendMessageParams) => Promise<ChatMessage> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  // Get current user for the optimistic message
  const user = useSublaySelector(selectUser);
  const authUser = useSublaySelector(selectAuthUser);
  const currentUser = user || authUser;

  const send = useCallback(
    async ({
      content,
      gif,
      mentions,
      metadata,
      quotedMessageId,
      parentMessageId,
      files,
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }: SendMessageParams): Promise<ChatMessage> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!conversationId) throw new Error("No conversationId provided.");

      // Body fields like everything else on a POST: JSON keys, or form fields
      // on a multipart send.
      const reputationFields = buildSpaceReputationParams({
        spaceReputation,
        spaceReputationId,
        spaceReputationDescendants,
      });

      const localId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert optimistic message immediately
      const optimisticMsg: ChatMessage = {
        id: `temp-${localId}`,
        localId,
        projectId,
        conversationId,
        userId: currentUser?.id ?? null,
        content: content ?? null,
        gif: gif ?? null,
        mentions: mentions ?? [],
        metadata: metadata ?? {},
        parentMessageId: parentMessageId ?? null,
        quotedMessageId: quotedMessageId ?? null,
        threadReplyCount: 0,
        reactionCounts: {},
        userReactions: [],
        editedAt: null,
        userDeletedAt: null,
        moderationStatus: null,
        moderatedAt: null,
        moderatedById: null,
        moderatedByType: null,
        moderationReason: null,
        createdAt: now,
        updatedAt: now,
        user: currentUser ?? null,
      };
      dispatch(addOptimisticMessage(optimisticMsg));

      try {
        let response;

        if (files && files.length > 0) {
          // Multipart upload when files are attached
          const formData = new FormData();
          formData.append("localId", localId);
          if (content) formData.append("content", content);
          if (gif) formData.append("gif", JSON.stringify(gif));
          if (mentions && mentions.length > 0)
            formData.append("mentions", JSON.stringify(mentions));
          if (metadata && Object.keys(metadata).length > 0)
            formData.append("metadata", JSON.stringify(metadata));
          if (quotedMessageId) formData.append("quotedMessageId", quotedMessageId);
          if (parentMessageId) formData.append("parentMessageId", parentMessageId);
          if (reputationFields.spaceReputationId !== undefined)
            formData.append("spaceReputationId", reputationFields.spaceReputationId);
          if (reputationFields.spaceReputationDescendants !== undefined)
            formData.append(
              "spaceReputationDescendants",
              String(reputationFields.spaceReputationDescendants)
            );
          files.forEach((file) => formData.append("files", file));
          response = await axios.post(
            `/${projectId}/chat/conversations/${conversationId}/messages`,
            formData,
            { headers: { "Content-Type": "multipart/form-data" } }
          );
        } else {
          // JSON body for text/gif-only messages
          response = await axios.post(
            `/${projectId}/chat/conversations/${conversationId}/messages`,
            {
              localId,
              ...(content !== undefined && { content }),
              ...(gif !== undefined && { gif }),
              ...(mentions !== undefined && { mentions }),
              ...(metadata !== undefined && { metadata }),
              ...(quotedMessageId !== undefined && { quotedMessageId }),
              ...(parentMessageId !== undefined && { parentMessageId }),
              ...reputationFields,
            }
          );
        }

        const confirmedMsg = response.data as ChatMessage;
        dispatch(upsertMessage(confirmedMsg));
        return confirmedMsg;
      } catch (err) {
        dispatch(failOptimisticMessage({ conversationId, localId }));
        handleError(err, "Failed to send message");
        throw err;
      }
    },
    [projectId, conversationId, currentUser, axios, dispatch]
  );

  return send;
}

export default useSendMessage;

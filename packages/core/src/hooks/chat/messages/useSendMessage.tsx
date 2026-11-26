import { useCallback } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import {
  addOptimisticMessage,
  upsertMessage,
  failOptimisticMessage,
  selectConversation,
} from "../../../store/slices/chatSlice";
import { selectUser } from "../../../store/slices/userSlice";
import { selectUser as selectAuthUser } from "../../../store/slices/authSlice";
import {
  ChatMessage,
  SentChatMessage,
} from "../../../interfaces/models/ChatMessage";
import { GifData } from "../../../interfaces/models/Comment";
import { Mention } from "../../../interfaces/models/Mention";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { SpaceReputationContextParams } from "../../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../../utils/spaceReputationParams";
import {
  appendFileList,
  appendImageList,
  hasListFiles,
  type FileListUpload,
  type ImageListUpload,
} from "../../../utils/uploads";
import { SublayError } from "../../../errors/SublayError";

export interface SendMessageParams extends SpaceReputationContextParams {
  content?: string;
  gif?: GifData | null;
  mentions?: Mention[];
  metadata?: Record<string, any>;
  quotedMessageId?: string;
  parentMessageId?: string;
  /**
   * Images on the message, processed into sizes per `options` (`mode` is
   * required). Sends multipart. Requires the files-images bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the message, stored as uploaded. Sends multipart. Requires the
   * files-images bundle.
   */
  files?: FileListUpload;
}

/** The created message; `localId` is the one this send generated. */
export type SendMessageResult = SentChatMessage & { localId?: string };

export interface UseSendMessageProps {
  conversationId: string;
}

function useSendMessage({
  conversationId,
}: UseSendMessageProps): (
  params: SendMessageParams
) => Promise<SendMessageResult> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  // Get current user for the optimistic message
  const user = useSublaySelector(selectUser);
  const authUser = useSublaySelector(selectAuthUser);
  const currentUser = user || authUser;
  const conversation = useSublaySelector(selectConversation(conversationId));
  const spaceId = conversation?.spaceId ?? null;

  const send = useCallback(
    async ({
      content,
      gif,
      mentions,
      metadata,
      quotedMessageId,
      parentMessageId,
      images,
      files,
      spaceReputation,
    }: SendMessageParams): Promise<SendMessageResult> => {
      if (!projectId) throw new SublayError("No projectId available.");
      if (!conversationId) throw new SublayError("No conversationId provided.");

      // Body fields like everything else on a POST: JSON keys, or form fields
      // on a multipart send.
      const reputationFields = buildSpaceReputationParams({ spaceReputation });

      const localId = crypto.randomUUID();
      const now = new Date().toISOString();

      // Insert optimistic message immediately
      const optimisticMsg: ChatMessage = {
        id: `temp-${localId}`,
        localId,
        conversationId,
        spaceId,
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
        quotedMessage: null,
      };
      dispatch(addOptimisticMessage(optimisticMsg));

      try {
        let response;

        const hasImages = hasListFiles(images);
        const hasFiles = hasListFiles(files);

        if (hasImages || hasFiles) {
          // Multipart upload when images or files are attached
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
          // A multipart field can't carry null: a null `gif` (no GIF) is left out.
          if (hasImages) appendImageList(formData, images!);
          if (hasFiles) appendFileList(formData, files!);
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

        const confirmedMsg = response.data as SendMessageResult;
        dispatch(upsertMessage(confirmedMsg));
        return confirmedMsg;
      } catch (err) {
        dispatch(failOptimisticMessage({ conversationId, localId }));
        handleError(err, "Failed to send message");
        throw err;
      }
    },
    [projectId, conversationId, spaceId, currentUser, axios, dispatch]
  );

  return send;
}

export default useSendMessage;

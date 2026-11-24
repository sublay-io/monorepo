import { SublayHttpClient } from "../../core/client";
import { SentChatMessage } from "../../interfaces/ChatMessage";
import { GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  withoutNulls,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/multipart";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface SendMessageProps extends SpaceReputationContextParams {
  conversationId: string;
  content?: string;
  gif?: GifData | null;
  mentions?: Mention[];
  parentMessageId?: string;
  quotedMessageId?: string;
  metadata?: Record<string, any>;
  /** Client-generated id echoed back on the created message (not stored). */
  localId?: string;
  /**
   * Images on the message, processed into sizes per `options` (`mode` is
   * required). When present the request is sent as `multipart/form-data`.
   * Requires the `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the message, stored as uploaded. When present the request is
   * sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  files?: FileListUpload;
}

/** The created message; `localId` is echoed back when the send passed one. */
export type SendMessageResponse = SentChatMessage & { localId?: string };

export async function sendMessage(
  client: SublayHttpClient,
  data: SendMessageProps
): Promise<SendMessageResponse> {
  const {
    conversationId,
    images,
    files,
    // Body fields like everything else on a POST (JSON keys, or form fields on
    // a multipart send), flattened via the helper so the `spaceReputation`
    // object never reaches the serializer.
    spaceReputation,
    ...body
  } = data;
  const path = `/chat/conversations/${conversationId}/messages`;
  const fields = {
    ...body,
    ...buildSpaceReputationParams({ spaceReputation }),
  };

  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    appendListUploads(formData, { images, files });
    // Multer delivers non-file fields as strings; the server's
    // parseChatMessageFields middleware JSON-parses gif/mentions/metadata back,
    // so object/array fields must be stringified here. A multipart field
    // can't carry null: a null `gif` (no GIF) is left out.
    appendFields(formData, withoutNulls(fields));
    const response = await client.projectInstance.post<SendMessageResponse>(
      path,
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<SendMessageResponse>(path, fields);
  return response.data;
}

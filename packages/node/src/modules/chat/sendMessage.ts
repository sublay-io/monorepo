import { SublayHttpClient } from "../../core/client";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  withoutNulls,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/formData";
import { SentChatMessage } from "../../interfaces/ChatMessage";
import { GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface SendMessageProps extends SpaceReputationContextParams {
  conversationId: string;
  /** The message author (must be a member). Service key required to name a user. */
  actingUserId: string;
  content?: string;
  gif?: GifData | null;
  mentions?: Mention[];
  parentMessageId?: string;
  quotedMessageId?: string;
  metadata?: Record<string, any>;
  /** Client-generated id echoed back on the created message (not stored). */
  localId?: string;
  /**
   * Images on the message, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the message, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
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
    spaceReputation,
    ...body
  } = data;
  const url = `/chat/conversations/${conversationId}/messages`;

  // Space-reputation opts are body fields, like everything else on a POST: JSON
  // keys, or form fields on a multipart send (booleans become "true"/"false").
  const fields = {
    ...body,
    ...buildSpaceReputationParams({ spaceReputation }),
  };

  // With images or files, send multipart: object fields are JSON-stringified (the
  // server parses them back) and the files are appended. Otherwise send JSON.
  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    // A multipart field can't carry null: a null `gif` (no GIF) is left out.
    appendFields(formData, withoutNulls(fields));
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.post<SendMessageResponse>(
      url,
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<SendMessageResponse>(url, fields);
  return response.data;
}

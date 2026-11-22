import { SublayHttpClient } from "../../core/client";
import { SentChatMessage } from "../../interfaces/ChatMessage";
import { GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";
import { appendFields, appendFile } from "../../core/multipart";
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
   * Optional file attachments (browser `File`/`Blob`), up to 20, at most 50 MB
   * each. When present the request is sent as `multipart/form-data`;
   * otherwise it's a JSON body.
   */
  files?: (Blob | File)[];
}

/** The created message; `localId` is echoed back when the send passed one. */
export type SendMessageResponse = SentChatMessage & { localId?: string };

export async function sendMessage(
  client: SublayHttpClient,
  data: SendMessageProps
): Promise<SendMessageResponse> {
  const {
    conversationId,
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

  if (files && files.length > 0) {
    const formData = new FormData();
    // The server's multer config reads attachments from the `files` field.
    for (const file of files) {
      appendFile(formData, "files", file, { fallback: "attachment" });
    }
    // Multer delivers non-file fields as strings; the server's
    // parseChatMessageFields middleware JSON-parses gif/mentions/metadata back,
    // so object/array fields must be stringified here.
    appendFields(formData, fields);
    const response = await client.projectInstance.post<SendMessageResponse>(
      path,
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<SendMessageResponse>(path, fields);
  return response.data;
}

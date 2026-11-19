import { SublayHttpClient } from "../../core/client";
import { Conversation } from "../../interfaces/Conversation";
import { appendField, appendFields, appendFile } from "../../core/multipart";
import type { SpaceImageUpload } from "../spaces/createSpace";

export interface UpdateConversationProps {
  conversationId: string;
  name?: string;
  description?: string;
  /**
   * New avatar image. When present the request is sent as `multipart/form-data`
   * and the server processes the image per `options`, replacing the old avatar.
   */
  avatarFile?: SpaceImageUpload;
  /** Space conversations only: who may post. */
  postingPermission?: "members" | "team";
}

export async function updateConversation(
  client: SublayHttpClient,
  data: UpdateConversationProps
): Promise<Conversation> {
  const { conversationId, avatarFile, ...body } = data;
  const path = `/chat/conversations/${conversationId}`;

  if (avatarFile) {
    const formData = new FormData();
    appendFile(formData, "avatarFile", avatarFile.file, { fallback: "avatar" });
    appendField(formData, "avatarFile.options", avatarFile.options);
    appendFields(formData, body);

    const response = await client.projectInstance.patch<Conversation>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Conversation>(path, body);
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Conversation } from "../../interfaces/Conversation";
import {
  appendFields,
  appendImageSlot,
  type ImageSlotFile,
} from "../../core/formData";

export interface UpdateConversationProps {
  conversationId: string;
  /** The acting user (must be a group admin). Service key required to name a user. */
  actingUserId: string;
  name?: string;
  description?: string;
  /**
   * A new avatar image, replacing the current one. When present the request
   * is sent as `multipart/form-data`.
   */
  avatarFile?: ImageSlotFile;
  /**
   * Files to remove: the conversation's `avatarFileId` (no other id is
   * accepted). Removing it clears the avatar. Works with or without a new
   * avatar in the same request.
   */
  removeFileIds?: string[];
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
    appendFields(formData, body);
    appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    const response = await client.projectInstance.patch<Conversation>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.patch<Conversation>(path, body);
  return response.data;
}

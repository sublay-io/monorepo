import { SublayHttpClient } from "../../core/client";
import { Conversation } from "../../interfaces/Conversation";
import {
  appendFields,
  appendImageSlot,
  type ImageSlotFile,
} from "../../core/formData";

export interface CreateGroupConversationProps {
  /** The acting user (becomes the group admin). Service key required to name a user. */
  actingUserId: string;
  name?: string;
  description?: string;
  memberIds?: string[];
  metadata?: Record<string, any>;
  /**
   * The group's avatar image, processed per `options`. When present the
   * request is sent as `multipart/form-data`.
   */
  avatarFile?: ImageSlotFile;
}

export async function createGroupConversation(
  client: SublayHttpClient,
  data: CreateGroupConversationProps
): Promise<Conversation> {
  const { avatarFile, ...body } = data;

  if (avatarFile) {
    const formData = new FormData();
    appendFields(formData, { type: "group", ...body });
    appendImageSlot(formData, "avatarFile", avatarFile, "avatar");
    const response = await client.projectInstance.post<Conversation>(
      "/chat/conversations",
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<Conversation>(
    "/chat/conversations",
    { type: "group", ...body }
  );
  return response.data;
}

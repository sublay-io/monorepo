import { SublayHttpClient } from "../../core/client";
import { Conversation } from "../../interfaces/Conversation";
import { appendField, appendFields, appendFile } from "../../core/multipart";
import type { SpaceImageUpload } from "../spaces/createSpace";

export interface CreateGroupConversationProps {
  name?: string;
  description?: string;
  /** Member user IDs to add to the group. Defaults to []. */
  memberIds?: string[];
  metadata?: Record<string, any>;
  /**
   * The group's avatar image. When present the request is sent as
   * `multipart/form-data` and the server processes the image per `options`.
   */
  avatarFile?: SpaceImageUpload;
}

export async function createGroupConversation(
  client: SublayHttpClient,
  data: CreateGroupConversationProps
): Promise<Conversation> {
  const { avatarFile, ...body } = data;

  if (avatarFile) {
    const formData = new FormData();
    appendField(formData, "type", "group");
    appendFile(formData, "avatarFile", avatarFile.file, { fallback: "avatar" });
    appendField(formData, "avatarFile.options", avatarFile.options);
    appendFields(formData, body);

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

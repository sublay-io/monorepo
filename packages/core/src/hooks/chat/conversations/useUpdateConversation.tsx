import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { Conversation } from "../../../interfaces/models/Conversation";
import { appendImageSlot, type ImageSlotUpload } from "../../../utils/uploads";

export interface UpdateConversationParams {
  conversationId: string;
  name?: string;
  description?: string;
  /**
   * New avatar image. When present the request is sent as multipart form data
   * and the server processes the image per `options`, replacing the old avatar.
   */
  avatarFile?: ImageSlotUpload;
  /**
   * Files to remove: the conversation's `avatarFileId`. Removing it clears
   * the avatar. Any other id refuses the whole update.
   */
  removeFileIds?: string[];
  postingPermission?: "members" | "team";
}

function useUpdateConversation(): (
  params: UpdateConversationParams
) => Promise<Conversation> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const update = useCallback(
    async ({
      conversationId,
      avatarFile,
      ...rest
    }: UpdateConversationParams): Promise<Conversation> => {
      if (!projectId) throw new Error("No projectId available.");
      if (!conversationId) throw new Error("Please pass a conversationId.");

      const path = `/${projectId}/chat/conversations/${conversationId}`;

      if (avatarFile) {
        const formData = new FormData();
        if (rest.name !== undefined) formData.append("name", rest.name);
        if (rest.description !== undefined) {
          formData.append("description", rest.description);
        }
        if (rest.postingPermission !== undefined) {
          formData.append("postingPermission", rest.postingPermission);
        }
        if (rest.removeFileIds !== undefined) {
          formData.append("removeFileIds", JSON.stringify(rest.removeFileIds));
        }
        appendImageSlot(formData, "avatarFile", avatarFile);

        const response = await axios.patch(path, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data as Conversation;
      }

      const response = await axios.patch(path, rest);
      return response.data as Conversation;
    },
    [projectId, axios]
  );

  return update;
}

export default useUpdateConversation;

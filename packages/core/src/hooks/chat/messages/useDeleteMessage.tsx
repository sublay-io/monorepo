import { useCallback } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import { applyOwnDelete } from "../../../store/slices/chatSlice";
import { selectUser } from "../../../store/slices/userSlice";
import { selectUser as selectAuthUser } from "../../../store/slices/authSlice";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";

export interface DeleteMessageParams {
  conversationId: string;
  messageId: string;
}

function useDeleteMessage(): (params: DeleteMessageParams) => Promise<void> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();
  const user = useSublaySelector(selectUser);
  const authUser = useSublaySelector(selectAuthUser);
  const currentUserId = (user || authUser)?.id ?? null;

  const deleteMsg = useCallback(
    async ({ conversationId, messageId }: DeleteMessageParams): Promise<void> => {
      if (!projectId) throw new Error("No projectId available.");

      try {
        await axios.delete(
          `/${projectId}/chat/conversations/${conversationId}/messages/${messageId}`
        );
        // The message stays, as the placeholder the server now returns for
        // it: deleted when it's the user's own, removed when it's someone
        // else's (a group admin's delete).
        dispatch(
          applyOwnDelete({
            conversationId,
            messageId,
            currentUserId,
            deletedAt: new Date().toISOString(),
          })
        );
      } catch (err) {
        handleError(err, "Failed to delete message");
        throw err;
      }
    },
    [projectId, axios, dispatch, currentUserId]
  );

  return deleteMsg;
}

export default useDeleteMessage;

import { useCallback } from "react";
import { useSublayDispatch, useSublaySelector } from "../../../store/hooks";
import { updateReactions } from "../../../store/slices/chatSlice";
import { selectUser } from "../../../store/slices/userSlice";
import { selectUser as selectAuthUser } from "../../../store/slices/authSlice";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import { handleError } from "../../../utils/handleError";
import { SublayError } from "../../../errors/SublayError";

export interface ToggleReactionParams {
  conversationId: string;
  messageId: string;
  emoji: string;
}

export interface ToggleReactionResult {
  reactionCounts: Record<string, number>;
  userReactions: string[];
  /** 1 when the toggle added the reaction, -1 when it removed it. */
  delta: 1 | -1;
}

function useToggleReaction(): (
  params: ToggleReactionParams
) => Promise<ToggleReactionResult> {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const user = useSublaySelector(selectUser);
  const authUser = useSublaySelector(selectAuthUser);
  const currentUserId = (user || authUser)?.id ?? "";

  const toggle = useCallback(
    async ({
      conversationId,
      messageId,
      emoji,
    }: ToggleReactionParams): Promise<ToggleReactionResult> => {
      if (!projectId) throw new SublayError("No projectId available.");

      try {
        const response = await axios.post(
          `/${projectId}/chat/conversations/${conversationId}/messages/${messageId}/reactions`,
          { emoji }
        );
        const { reactionCounts, userReactions, delta } = response.data as {
          reactionCounts: Record<string, number>;
          userReactions: string[];
          delta: 1 | -1;
        };

        dispatch(
          updateReactions({
            conversationId,
            messageId,
            reactionCounts,
            userId: currentUserId,
            emoji,
            delta,
            currentUserId,
          })
        );

        return { reactionCounts, userReactions, delta };
      } catch (err) {
        handleError(err, "Failed to toggle reaction");
        throw err;
      }
    },
    [projectId, currentUserId, axios, dispatch]
  );

  return toggle;
}

export default useToggleReaction;

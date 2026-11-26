import { useCallback } from "react";
import useProject from "../../projects/useProject";
import { useUser } from "../../user";
import { useMuteConversationMutation } from "../../../store/api/notificationPreferencesApi";
import { useSublayDispatch } from "../../../store/hooks";
import { applyOwnMute } from "../../../store/slices/chatSlice";
import { handleError } from "../../../utils/handleError";
import type { MuteDuration } from "../../../interfaces/MuteDuration";
import type { ConversationMember } from "../../../interfaces/models/ConversationMember";
import { SublayError, rethrowAsSublayError, toSublayError } from "../../../errors/SublayError";

export interface MuteConversationProps {
  conversationId: string;
  /**
   * The duration CHOICE (`8h` / `24h` / `1w` / `forever`), or `null` to clear
   * the mute. Never a raw timestamp — the server resolves the choice and
   * represents "forever" via the returned member's explicit `mutedForever`
   * signal.
   */
  duration: MuteDuration | null;
}

export interface UseMuteConversationValues {
  /**
   * Set or clear the acting user's mute on a conversation. Resolves to the
   * updated (self-serialized) `currentMember` — read `mutedForever` /
   * `mutedUntil` off it for the resulting state. The conversation's inbox row
   * and its loaded `currentMember` are updated to match.
   */
  muteConversation: (props: MuteConversationProps) => Promise<ConversationMember>;
  muting: boolean;
}

/**
 * Set / clear the acting user's conversation mute. Mirrors the server's
 * `POST /:projectId/chat/conversations/:conversationId/mute` exactly.
 */
function useMuteConversation(): UseMuteConversationValues {
  const { projectId } = useProject();
  const { user } = useUser();
  const dispatch = useSublayDispatch();
  const [muteMutation, { isLoading: muting }] = useMuteConversationMutation();

  const muteConversation = useCallback(
    async ({
      conversationId,
      duration,
    }: MuteConversationProps): Promise<ConversationMember> => {
      if (!projectId || !user) {
        throw new SublayError("No project ID or authenticated user available");
      }
      if (!conversationId) throw new SublayError("Please pass a conversationId.");

      try {
        const { currentMember } = await muteMutation({
          projectId,
          conversationId,
          duration,
        }).unwrap().catch(rethrowAsSublayError);
        dispatch(applyOwnMute({ conversationId, currentMember }));
        return currentMember;
      } catch (err) {
        handleError(err, "Failed to mute conversation");
        throw toSublayError(err);
      }
    },
    [projectId, user, muteMutation, dispatch]
  );

  return { muteConversation, muting };
}

export default useMuteConversation;

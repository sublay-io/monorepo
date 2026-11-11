import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event } from "../../interfaces/models/Event";

export interface RemoveInviteProps {
  eventId: string;
  /**
   * The invitee to remove. Their RSVP is dropped only on an `invite` event,
   * when an invite was removed and they can no longer RSVP to it.
   */
  userId: string;
}

/**
 * Removes a user's invite. Hosts only (403 `event/forbidden`, the space's
 * admins and moderators included), and on an event in a space only while
 * they are active members of it and not banned in it or a space above it
 * (403 `event/not-space-member`).
 */
function useRemoveInvite(): (props: RemoveInviteProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const removeInvite = useCallback(
    async ({ eventId, userId }: RemoveInviteProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.delete(
        `/${projectId}/events/${eventId}/invites/${userId}`
      );

      return response.data as Event;
    },
    [projectId, axios]
  );

  return removeInvite;
}

export default useRemoveInvite;

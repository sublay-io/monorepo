import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event } from "../../interfaces/models/Event";

export interface RemoveInviteProps {
  eventId: string;
  /** The invitee to remove. Also drops their RSVP and revokes access. */
  userId: string;
}

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

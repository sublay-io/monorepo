import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, RsvpStatus } from "../../interfaces/models/Event";

export interface SetRsvpProps {
  eventId: string;
  status: RsvpStatus;
}

/**
 * Sets or changes the logged-in user's RSVP. Refused with 404
 * `event/not-found` when they can't see the event, 403
 * `space/posting-not-allowed` when they can but are banned in its space or a
 * space above it, and 403 `event/not-invited` on an `invite` event they see
 * only as an admin or moderator of its space, without an invite.
 */
function useSetRsvp(): (props: SetRsvpProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const setRsvp = useCallback(
    async ({ eventId, status }: SetRsvpProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.post(
        `/${projectId}/events/${eventId}/rsvp`,
        { status }
      );

      return response.data as Event;
    },
    [projectId, axios]
  );

  return setRsvp;
}

export default useSetRsvp;

import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event } from "../../interfaces/models/Event";

export interface AddHostProps {
  eventId: string;
  /** The user to make a host. For an event in a space, an active member of it. */
  userId: string;
}

/**
 * Adds a host to an event. Only the event's owner may, while an active member
 * of the event's space and not banned in it or a space above it (403
 * `event/not-space-member` otherwise); other hosts get 403 `event/forbidden`.
 * For an event in a space, the new host must be an active member of it (409
 * `event/host-not-member`).
 */
function useAddHost(): (props: AddHostProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const addHost = useCallback(
    async ({ eventId, userId }: AddHostProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.post(
        `/${projectId}/events/${eventId}/hosts`,
        { userId }
      );

      return response.data as Event;
    },
    [projectId, axios]
  );

  return addHost;
}

export default useAddHost;

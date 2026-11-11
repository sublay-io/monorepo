import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { CancelEventResponse } from "../../interfaces/models/Event";

export interface CancelEventProps {
  eventId: string;
}

/**
 * Cancels an event. Allowed for the event's owner (also without active
 * membership of its space) and for the active admins and moderators of its
 * space. On an event whose owner's account was deleted (`userId` null), its
 * hosts may cancel it too, while they are active members of the event's space
 * and not banned in it or a space above it (403 `event/not-space-member`
 * otherwise). Anyone else who can see the event gets 403 `event/forbidden`;
 * anyone who can't, and isn't a host, gets 404 `event/not-found`.
 *
 * Returns the full event, or `{ id, status: "cancelled" }` when the caller
 * can't see the event.
 */
function useCancelEvent(): (
  props: CancelEventProps
) => Promise<CancelEventResponse> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const cancelEvent = useCallback(
    async ({ eventId }: CancelEventProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!eventId) {
        throw new Error("No eventId provided.");
      }

      const response = await axios.post(`/${projectId}/events/${eventId}/cancel`);

      return response.data as CancelEventResponse;
    },
    [projectId, axios]
  );

  return cancelEvent;
}

export default useCancelEvent;

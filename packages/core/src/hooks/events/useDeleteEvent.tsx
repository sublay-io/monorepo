import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";

export interface DeleteEventProps {
  eventId: string;
}

/**
 * Deletes an event. Allowed for the same callers as cancelling: the event's
 * owner (also without active membership of its space) and the active admins
 * and moderators of its space; on an event whose owner's account was deleted
 * (`userId` null), also its hosts while they are active members of the
 * event's space and not banned in it or a space above it (403
 * `event/not-space-member` otherwise). Anyone else who can see the event gets
 * 403 `event/forbidden`.
 */
function useDeleteEvent(): (props: DeleteEventProps) => Promise<void> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const deleteEvent = useCallback(
    async ({ eventId }: DeleteEventProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }
      if (!eventId) {
        throw new Error("No eventId provided.");
      }

      await axios.delete(`/${projectId}/events/${eventId}`);
    },
    [projectId, axios]
  );

  return deleteEvent;
}

export default useDeleteEvent;

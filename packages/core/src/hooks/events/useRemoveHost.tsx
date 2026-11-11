import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { RemoveHostResponse } from "../../interfaces/models/Event";

export interface RemoveHostProps {
  eventId: string;
  /** The host to remove, or the logged-in user to step down. */
  userId: string;
}

/**
 * Removes a host from an event, or steps the logged-in user down as host.
 *
 * - Removing another host: only the event's owner, while an active member of
 *   the event's space and not banned in it or a space above it (403
 *   `event/not-space-member` otherwise). Other hosts get 403 `event/forbidden`.
 * - Stepping down: any host but the owner, active member or not. The owner
 *   can't step down (409 `event/owner-is-host`). On an event whose owner's
 *   account was deleted, its last host can't step down (409 `event/last-host`).
 *
 * Returns the full event, or `{ id }` after stepping down from an event the
 * logged-in user can no longer see.
 */
function useRemoveHost(): (
  props: RemoveHostProps
) => Promise<RemoveHostResponse> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const removeHost = useCallback(
    async ({ eventId, userId }: RemoveHostProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.delete(
        `/${projectId}/events/${eventId}/hosts/${userId}`
      );

      return response.data as RemoveHostResponse;
    },
    [projectId, axios]
  );

  return removeHost;
}

export default useRemoveHost;

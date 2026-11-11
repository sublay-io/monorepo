import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { EventRsvp, RsvpStatus } from "../../interfaces/models/Event";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";

export interface FetchEventRsvpsProps {
  eventId: string;
  page?: number;
  limit?: number;
  /** RSVP statuses to filter by, e.g. ["going","maybe"]. Omit for all. */
  status?: RsvpStatus | RsvpStatus[];
}

/**
 * Named RSVP (guest) list. Visible to any viewer of the event when its
 * `guestListVisible` is true; otherwise only to hosts who are active members
 * of the event's space (any host, for an event with no space) and the active
 * admins and moderators of its space (403 `event/guest-list-hidden` for anyone
 * else). RSVP counts themselves are public via the event's `rsvpCounts`.
 */
function useFetchEventRsvps(): (
  props: FetchEventRsvpsProps
) => Promise<PaginatedResponse<EventRsvp>> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchEventRsvps = useCallback(
    async ({ eventId, page, limit, status }: FetchEventRsvpsProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const params: Record<string, any> = {};
      if (page !== undefined) params.page = page;
      if (limit !== undefined) params.limit = limit;
      if (status) {
        params.status = Array.isArray(status) ? status.join(",") : status;
      }

      const response = await axios.get<PaginatedResponse<EventRsvp>>(
        `/${projectId}/events/${eventId}/rsvps`,
        { params }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchEventRsvps;
}

export default useFetchEventRsvps;

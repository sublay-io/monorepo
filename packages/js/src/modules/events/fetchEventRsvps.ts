import { SublayHttpClient } from "../../core/client";
import { serializeInclude } from "../../core/includeParam";
import { EventRsvp, RsvpStatus } from "../../interfaces/Event";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchEventRsvpsProps {
  eventId: string;
  page?: number;
  limit?: number; // capped at 100 server-side
  /**
   * RSVP statuses to filter by, e.g. `["going", "maybe"]`. Exact match. When
   * omitted, all statuses are returned.
   */
  status?: RsvpStatus | RsvpStatus[];
}

/**
 * Named RSVP (guest) list. Visible to hosts always, or to any viewer when the
 * event's `guestListVisible` is true; otherwise 403. RSVP counts themselves are
 * public via the event's `rsvpCounts`.
 */
export async function fetchEventRsvps(
  client: SublayHttpClient,
  data: FetchEventRsvpsProps
): Promise<PaginatedResponse<EventRsvp>> {
  const { eventId, ...rest } = data;
  const params = { ...rest, status: serializeInclude(rest.status) };
  const response = await client.projectInstance.get<
    PaginatedResponse<EventRsvp>
  >(`/events/${eventId}/rsvps`, { params });
  return response.data;
}

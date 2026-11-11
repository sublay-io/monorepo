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
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (event visibility, the host check). Omit it for the anonymous
   * view.
   */
  actingUserId?: string;
}

/**
 * Named RSVP (guest) list. Visible to any viewer of the event when its
 * `guestListVisible` is true; otherwise only to hosts who are active members
 * of the event's space (any host, for an event with no space) and the active
 * admins and moderators of its space (403 `event/guest-list-hidden` for anyone
 * else). RSVP counts themselves are public via the event's `rsvpCounts`.
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

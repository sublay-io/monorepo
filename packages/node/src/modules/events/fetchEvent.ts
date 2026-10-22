import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface FetchEventProps {
  eventId: string;
  /** Comma-separated associations to expand, e.g. "user,space,files,userRsvp". */
  include?: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get (event visibility, `userRsvp`). Omit it for the anonymous view
   * (public events only).
   */
  actingUserId?: string;
}

export async function fetchEvent(
  client: SublayHttpClient,
  data: FetchEventProps
): Promise<Event> {
  const { eventId, ...params } = data;
  const response = await client.projectInstance.get<Event>(
    `/events/${eventId}`,
    { params }
  );
  return response.data;
}

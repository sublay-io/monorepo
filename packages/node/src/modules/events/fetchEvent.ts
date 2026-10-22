import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface FetchEventProps {
  eventId: string;
  /** Comma-separated associations to expand, e.g. "user,space,files,userRsvp". */
  include?: string;
  /** The user the service key acts as, for that user's view (visibility, `userRsvp`). Omit for the key's own view. */
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

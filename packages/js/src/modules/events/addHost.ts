import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

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
export async function addHost(
  client: SublayHttpClient,
  data: AddHostProps
): Promise<Event> {
  const { eventId, userId } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/hosts`,
    { userId }
  );
  return response.data;
}

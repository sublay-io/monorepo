import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface AddHostProps {
  eventId: string;
  /** The user to make a host. For an event in a space, an active member of it. */
  userId: string;
  /**
   * The user this request acts as: the event's owner. It has exactly that
   * user's powers on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
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
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/hosts`,
    { userId, actingUserId }
  );
  return response.data;
}

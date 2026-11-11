import { SublayHttpClient } from "../../core/client";
import { Event, RsvpStatus } from "../../interfaces/Event";

export interface SetRsvpProps {
  eventId: string;
  status: RsvpStatus;
  /** The user the service key acts as, held to that user's own event visibility. */
  actingUserId: string;
}

/**
 * Sets or changes the caller's RSVP. Refused with 404 `event/not-found` when
 * they can't see the event, 403 `space/posting-not-allowed` when they can but
 * are banned in its space or a space above it, and 403 `event/not-invited` on
 * an `invite` event they see only as an admin or moderator of its space,
 * without an invite.
 */
export async function setRsvp(
  client: SublayHttpClient,
  data: SetRsvpProps
): Promise<Event> {
  const { eventId, ...body } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/rsvp`,
    body
  );
  return response.data;
}

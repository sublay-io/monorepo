import { SublayHttpClient } from "../../core/client";
import { Event, RsvpStatus } from "../../interfaces/Event";

export interface SetRsvpProps {
  eventId: string;
  status: RsvpStatus;
  /** The user the service key acts as, held to that user's own event visibility. */
  actingUserId: string;
}

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

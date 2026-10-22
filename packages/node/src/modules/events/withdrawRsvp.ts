import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface WithdrawRsvpProps {
  eventId: string;
  /** The user the service key acts as, held to that user's own event visibility. */
  actingUserId: string;
}

export async function withdrawRsvp(
  client: SublayHttpClient,
  data: WithdrawRsvpProps
): Promise<Event> {
  const { eventId, ...body } = data;
  const response = await client.projectInstance.delete<Event>(
    `/events/${eventId}/rsvp`,
    { data: body }
  );
  return response.data;
}

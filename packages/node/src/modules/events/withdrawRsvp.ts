import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface WithdrawRsvpProps {
  eventId: string;
  /** The user the service key acts as. Required: the server refuses the call without it. */
  actingUserId?: string;
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

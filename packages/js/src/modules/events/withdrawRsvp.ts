import { SublayHttpClient } from "../../core/client";
import { WithdrawRsvpResponse } from "../../interfaces/Event";

export interface WithdrawRsvpProps {
  eventId: string;
}

/**
 * Withdraws the caller's RSVP. Works whenever they hold one, also on an event
 * they can no longer see. Returns the full event, or `{ id, userRsvp: null }`
 * when they can't see the event.
 */
export async function withdrawRsvp(
  client: SublayHttpClient,
  data: WithdrawRsvpProps
): Promise<WithdrawRsvpResponse> {
  const response = await client.projectInstance.delete<WithdrawRsvpResponse>(
    `/events/${data.eventId}/rsvp`
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface RemoveInviteProps {
  eventId: string;
  /** The invitee to remove. Also drops their RSVP and revokes access. */
  userId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function removeInvite(
  client: SublayHttpClient,
  data: RemoveInviteProps
): Promise<Event> {
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.delete<Event>(
    `/events/${eventId}/invites/${userId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface RemoveInviteProps {
  eventId: string;
  /**
   * The invitee to remove. Their RSVP is dropped only on an `invite` event,
   * when an invite was removed and they can no longer RSVP to it.
   */
  userId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

/**
 * Removes a user's invite. Hosts only (403 `event/forbidden`, the space's
 * admins and moderators included), and on an event in a space only while
 * they are active members of it and not banned in it or a space above it
 * (403 `event/not-space-member`).
 */
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

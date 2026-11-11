import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface AddInviteProps {
  eventId: string;
  /** The user to invite (userId only — never a foreignId). Re-inviting is a no-op. */
  userId: string;
}

/**
 * Invites a user to an event. Hosts only (403 `event/forbidden`), and on an
 * event in a space only while they are active members of it and not banned in
 * it or a space above it (403 `event/not-space-member`). A user who can't be
 * invited gets 409 `event/invitee-not-invitable`: one answer for a user who
 * can't read the space, is banned in it or a space above it, or — when the
 * space is private or members-only (or sits under such a space), or the event
 * is `members` — isn't an active member of the event's space itself.
 */
export async function addInvite(
  client: SublayHttpClient,
  data: AddInviteProps
): Promise<Event> {
  const { eventId, userId } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/invites`,
    { userId }
  );
  return response.data;
}

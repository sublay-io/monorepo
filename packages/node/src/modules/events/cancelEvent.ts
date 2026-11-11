import { SublayHttpClient } from "../../core/client";
import { CancelEventResponse } from "../../interfaces/Event";

export interface CancelEventProps {
  eventId: string;
  /**
   * The user this request acts as: the event's owner, an admin or moderator
   * of its space, or (on an event whose owner's account was deleted) one of
   * its hosts. It has exactly that user's powers on the event and is recorded
   * as theirs. Required.
   */
  actingUserId: string;
}

/**
 * Cancels an event. Allowed for the event's owner (also without active
 * membership of its space) and for the active admins and moderators of its
 * space. On an event whose owner's account was deleted (`userId` null), its
 * hosts may cancel it too, while they are active members of the event's space
 * and not banned in it or a space above it (403 `event/not-space-member`
 * otherwise). Anyone else who can see the event gets 403 `event/forbidden`;
 * anyone who can't, and isn't a host, gets 404 `event/not-found`.
 *
 * Returns the full event, or `{ id, status: "cancelled" }` when the caller
 * can't see the event.
 */
export async function cancelEvent(
  client: SublayHttpClient,
  data: CancelEventProps
): Promise<CancelEventResponse> {
  const response = await client.projectInstance.post<CancelEventResponse>(
    `/events/${data.eventId}/cancel`,
    { actingUserId: data.actingUserId }
  );
  return response.data;
}

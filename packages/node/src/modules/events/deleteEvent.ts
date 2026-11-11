import { SublayHttpClient } from "../../core/client";

export interface DeleteEventProps {
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
 * Deletes an event. Allowed for the same callers as cancelling: the event's
 * owner (also without active membership of its space) and the active admins
 * and moderators of its space; on an event whose owner's account was deleted
 * (`userId` null), also its hosts while they are active members of the
 * event's space and not banned in it or a space above it (403
 * `event/not-space-member` otherwise). Anyone else who can see the event gets
 * 403 `event/forbidden`.
 */
export async function deleteEvent(
  client: SublayHttpClient,
  data: DeleteEventProps
): Promise<void> {
  await client.projectInstance.delete<void>(`/events/${data.eventId}`, {
    params: { actingUserId: data.actingUserId },
  });
}

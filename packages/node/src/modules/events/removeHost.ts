import { SublayHttpClient } from "../../core/client";
import { RemoveHostResponse } from "../../interfaces/Event";

export interface RemoveHostProps {
  eventId: string;
  /** The host to remove, or the caller to step down. */
  userId: string;
  /**
   * The user this request acts as: the event's owner, or the host stepping
   * down. It has exactly that user's powers on the event and is recorded as
   * theirs. Required.
   */
  actingUserId: string;
}

/**
 * Removes a host from an event, or steps the caller down as host.
 *
 * - Removing another host: only the event's owner, while an active member of
 *   the event's space and not banned in it or a space above it (403
 *   `event/not-space-member` otherwise). Other hosts get 403 `event/forbidden`.
 * - Stepping down (`userId` is the caller): any host but the owner, active
 *   member or not. The owner can't step down (409 `event/owner-is-host`). On
 *   an event whose owner's account was deleted, its last host can't step down
 *   (409 `event/last-host`).
 *
 * Returns the full event, or `{ id }` after stepping down from an event the
 * caller can no longer see.
 */
export async function removeHost(
  client: SublayHttpClient,
  data: RemoveHostProps
): Promise<RemoveHostResponse> {
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.delete<RemoveHostResponse>(
    `/events/${eventId}/hosts/${userId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

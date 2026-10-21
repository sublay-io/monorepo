import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface AddInviteProps {
  eventId: string;
  /** The user to invite (userId only — never a foreignId). Idempotent. */
  userId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function addInvite(
  client: SublayHttpClient,
  data: AddInviteProps
): Promise<Event> {
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/invites`,
    { userId, actingUserId }
  );
  return response.data;
}

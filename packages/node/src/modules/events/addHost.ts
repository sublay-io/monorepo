import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface AddHostProps {
  eventId: string;
  /** The user to grant host on the event. */
  userId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function addHost(
  client: SublayHttpClient,
  data: AddHostProps
): Promise<Event> {
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.post<Event>(
    `/events/${eventId}/hosts`,
    { userId, actingUserId }
  );
  return response.data;
}

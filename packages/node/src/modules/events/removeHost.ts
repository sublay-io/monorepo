import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface RemoveHostProps {
  eventId: string;
  /** The host to remove. Rejected if it would leave the event with no hosts. */
  userId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function removeHost(
  client: SublayHttpClient,
  data: RemoveHostProps
): Promise<Event> {
  const { eventId, userId, actingUserId } = data;
  const response = await client.projectInstance.delete<Event>(
    `/events/${eventId}/hosts/${userId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

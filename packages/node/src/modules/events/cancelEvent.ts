import { SublayHttpClient } from "../../core/client";
import { Event } from "../../interfaces/Event";

export interface CancelEventProps {
  eventId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function cancelEvent(
  client: SublayHttpClient,
  data: CancelEventProps
): Promise<Event> {
  const response = await client.projectInstance.post<Event>(
    `/events/${data.eventId}/cancel`,
    { actingUserId: data.actingUserId }
  );
  return response.data;
}

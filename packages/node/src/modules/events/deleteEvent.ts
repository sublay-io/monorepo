import { SublayHttpClient } from "../../core/client";

export interface DeleteEventProps {
  eventId: string;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function deleteEvent(
  client: SublayHttpClient,
  data: DeleteEventProps
): Promise<void> {
  await client.projectInstance.delete<void>(`/events/${data.eventId}`, {
    params: { actingUserId: data.actingUserId },
  });
}

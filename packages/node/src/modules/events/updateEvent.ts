import { SublayHttpClient } from "../../core/client";
import { Event, EventType, EventVisibility } from "../../interfaces/Event";

export interface UpdateEventProps {
  eventId: string;
  title?: string;
  description?: string;
  startTime?: string; // ISO datetime
  endTime?: string; // ISO datetime
  timezone?: string;
  type?: EventType;
  url?: string;
  venueName?: string;
  address?: string;
  location?: {
    latitude: number;
    longitude: number;
  };
  visibility?: EventVisibility;
  capacity?: number;
  allowMaybe?: boolean;
  guestListVisible?: boolean;
  metadata?: Record<string, any>;
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function updateEvent(
  client: SublayHttpClient,
  data: UpdateEventProps
): Promise<Event> {
  const { eventId, ...restOfProps } = data;
  const response = await client.projectInstance.patch<Event>(
    `/events/${eventId}`,
    restOfProps
  );
  return response.data;
}

import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Event, EventIncludeParam } from "../../interfaces/Event";

export interface FetchEventProps {
  eventId: string;
  /** Associations to expand: `user`, `space`, `files`, `userRsvp`. */
  include?: EventIncludeParam;
}

export async function fetchEvent(
  client: SublayHttpClient,
  data: FetchEventProps
): Promise<Event> {
  const { eventId, ...params } = data;
  const response = await client.projectInstance.get<Event>(
    `/events/${eventId}`,
    {
      params: { ...params, include: serializeInclude(params.include) },
    }
  );
  return response.data;
}

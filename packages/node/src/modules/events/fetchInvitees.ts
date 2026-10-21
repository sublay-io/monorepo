import { SublayHttpClient } from "../../core/client";
import { EventInvite } from "../../interfaces/Event";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchInviteesProps {
  eventId: string;
  page?: number;
  limit?: number; // capped at 100 server-side
  /**
   * The event host this request acts as. It has exactly that user's powers
   * on the event and is recorded as theirs. Required.
   */
  actingUserId: string;
}

/**
 * Host-only invitee (guest) list: `actingUserId` must be one of the event's hosts (403 otherwise).
 */
export async function fetchInvitees(
  client: SublayHttpClient,
  data: FetchInviteesProps
): Promise<PaginatedResponse<EventInvite>> {
  const { eventId, ...params } = data;
  const response = await client.projectInstance.get<
    PaginatedResponse<EventInvite>
  >(`/events/${eventId}/invites`, { params });
  return response.data;
}

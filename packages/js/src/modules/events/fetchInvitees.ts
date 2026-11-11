import { SublayHttpClient } from "../../core/client";
import { EventInvite } from "../../interfaces/Event";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface FetchInviteesProps {
  eventId: string;
  page?: number;
  limit?: number; // capped at 100 server-side
}

/**
 * Invitee (guest) list. Open to the event's hosts — on an event in a space,
 * while they are active members of it and not banned in it or a space above
 * it (403 `event/not-space-member` otherwise) — and to the active admins and
 * moderators of its space. Anyone else who can see the event gets 403
 * `event/forbidden`.
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

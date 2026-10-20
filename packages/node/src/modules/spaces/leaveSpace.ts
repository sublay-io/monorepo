import { SublayHttpClient } from "../../core/client";
import { LeaveSpaceResponse } from "../../interfaces/Space";

export interface LeaveSpaceProps {
  spaceId: string;
  /** The member who leaves: the request acts as them. */
  actingUserId: string;
}

export async function leaveSpace(
  client: SublayHttpClient,
  data: LeaveSpaceProps
): Promise<LeaveSpaceResponse> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.delete<LeaveSpaceResponse>(
    `/spaces/${spaceId}/leave`,
    { params: { actingUserId } }
  );
  return response.data;
}

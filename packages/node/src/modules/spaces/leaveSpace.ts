import { SublayHttpClient } from "../../core/client";

export interface LeaveSpaceProps {
  spaceId: string;
  /** The member who leaves: the request acts as them. */
  actingUserId: string;
}

export async function leaveSpace(
  client: SublayHttpClient,
  data: LeaveSpaceProps
): Promise<void> {
  const { spaceId, actingUserId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}/members/me`,
    { params: { actingUserId } }
  );
}

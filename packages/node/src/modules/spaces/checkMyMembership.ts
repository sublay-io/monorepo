import { SublayHttpClient } from "../../core/client";
import { CheckMyMembershipResponse } from "../../interfaces/Space";

export interface CheckMyMembershipProps {
  spaceId: string;
  actingUserId: string;
}

export async function checkMyMembership(
  client: SublayHttpClient,
  data: CheckMyMembershipProps
): Promise<CheckMyMembershipResponse> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.get<CheckMyMembershipResponse>(
    `/spaces/${spaceId}/membership/me`,
    { params: { actingUserId } }
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";

export interface LeaveSpaceProps {
  spaceId: string;
}

export async function leaveSpace(
  client: SublayHttpClient,
  data: LeaveSpaceProps
): Promise<void> {
  const { spaceId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}/members/me`
  );
}

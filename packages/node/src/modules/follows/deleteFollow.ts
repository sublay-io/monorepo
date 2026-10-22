import { SublayHttpClient } from "../../core/client";

export interface DeleteFollowByIdProps {
  followId: string;
  actingUserId: string;
}

export async function deleteFollow(
  client: SublayHttpClient,
  data: DeleteFollowByIdProps
): Promise<void> {
  const { followId, actingUserId } = data;
  await client.projectInstance.delete(`/follows/${followId}`, {
    params: { actingUserId },
  });
}

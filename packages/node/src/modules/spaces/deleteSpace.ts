import { SublayHttpClient } from "../../core/client";

export interface DeleteSpaceProps {
  spaceId: string;
  /**
   * The user this request acts as. The request behaves exactly as that user's
   * own token: only the space's creator may delete it, and not while banned
   * from the space or from a space above it. Required.
   */
  actingUserId: string;
}

export async function deleteSpace(
  client: SublayHttpClient,
  data: DeleteSpaceProps
): Promise<void> {
  const { spaceId, actingUserId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}`,
    { params: { actingUserId } }
  );
}

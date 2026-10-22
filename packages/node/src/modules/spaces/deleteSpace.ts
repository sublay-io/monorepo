import { SublayHttpClient } from "../../core/client";
import { DeleteSpaceResponse } from "../../interfaces/Space";

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
): Promise<DeleteSpaceResponse> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.delete<DeleteSpaceResponse>(
    `/spaces/${spaceId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

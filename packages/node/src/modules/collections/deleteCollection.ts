import { SublayHttpClient } from "../../core/client";
import { DeleteCollectionResponse } from "../../interfaces/Collection";

export interface DeleteCollectionProps {
  collectionId: string;
  actingUserId: string;
}

export async function deleteCollection(
  client: SublayHttpClient,
  data: DeleteCollectionProps
): Promise<DeleteCollectionResponse> {
  const { collectionId, actingUserId } = data;
  const response = await client.projectInstance.delete<DeleteCollectionResponse>(
    `/collections/${collectionId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

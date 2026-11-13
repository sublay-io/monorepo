import { SublayHttpClient } from "../../core/client";
import { CollectionEntityMutationResponse } from "./addEntityToCollection";

export interface RemoveEntityFromCollectionProps {
  collectionId: string;
  entityId: string;
  actingUserId: string;
}

export async function removeEntityFromCollection(
  client: SublayHttpClient,
  data: RemoveEntityFromCollectionProps
): Promise<CollectionEntityMutationResponse> {
  const { collectionId, entityId, actingUserId } = data;
  const response =
    await client.projectInstance.delete<CollectionEntityMutationResponse>(
      `/collections/${collectionId}/entities/${entityId}`,
      { params: { actingUserId } }
    );
  return response.data;
}

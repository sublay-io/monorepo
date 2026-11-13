import { SublayHttpClient } from "../../core/client";

export interface AddEntityToCollectionProps {
  collectionId: string;
  entityId: string;
  actingUserId: string;
}

export interface CollectionEntityMutationResponse {
  success: boolean;
  collection: {
    id: string;
    name: string;
    /** The collection's `entityCount` after the change, as the acting user sees it. */
    entityCount: number;
  };
}

export async function addEntityToCollection(
  client: SublayHttpClient,
  data: AddEntityToCollectionProps
): Promise<CollectionEntityMutationResponse> {
  const { collectionId, ...body } = data;
  const response =
    await client.projectInstance.post<CollectionEntityMutationResponse>(
      `/collections/${collectionId}/entities`,
      body
    );
  return response.data;
}

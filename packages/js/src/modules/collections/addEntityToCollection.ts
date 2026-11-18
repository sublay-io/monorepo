import { SublayHttpClient } from "../../core/client";

export interface AddEntityToCollectionProps {
  collectionId: string;
  entityId: string;
}

/**
 * The collection's summary after an add or remove. Adding answers 201 when the
 * entity was newly added and 200 when it was already in the collection;
 * removing answers 200 whether or not it was there.
 */
export interface CollectionEntityMutationResponse {
  id: string;
  name: string;
  /** The collection's `entityCount` after the change, as the viewer sees it. */
  entityCount: number;
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

import { SublayHttpClient } from "../../core/client";
import { Collection } from "../../interfaces/Collection";

export interface CreateNewCollectionProps {
  /** The parent collection under which to create the sub-collection. */
  collectionId: string;
  /** The new collection's name. Trimmed; 1 to 255 characters after trimming. */
  name: string;
}

export async function createNewCollection(
  client: SublayHttpClient,
  data: CreateNewCollectionProps
): Promise<Collection> {
  const { collectionId, ...body } = data;
  const response = await client.projectInstance.post<Collection>(
    `/collections/${collectionId}/sub-collections`,
    body
  );
  return response.data;
}

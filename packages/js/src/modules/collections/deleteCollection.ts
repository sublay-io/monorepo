import { SublayHttpClient } from "../../core/client";
import { DeleteCollectionResponse } from "../../interfaces/Collection";

export interface DeleteCollectionProps {
  collectionId: string;
}

export async function deleteCollection(
  client: SublayHttpClient,
  data: DeleteCollectionProps
): Promise<DeleteCollectionResponse> {
  const { collectionId } = data;
  const response = await client.projectInstance.delete<DeleteCollectionResponse>(
    `/collections/${collectionId}`
  );
  return response.data;
}

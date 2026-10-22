import { SublayHttpClient } from "../../core/client";

export interface DeleteCollectionProps {
  collectionId: string;
  actingUserId: string;
}

export async function deleteCollection(
  client: SublayHttpClient,
  data: DeleteCollectionProps
): Promise<void> {
  const { collectionId, actingUserId } = data;
  await client.projectInstance.delete(`/collections/${collectionId}`, {
    params: { actingUserId },
  });
}

import { SublayHttpClient } from "../../core/client";

export interface RemoveEntityFromCollectionProps {
  collectionId: string;
  entityId: string;
  actingUserId: string;
}

export async function removeEntityFromCollection(
  client: SublayHttpClient,
  data: RemoveEntityFromCollectionProps
): Promise<void> {
  const { collectionId, entityId, actingUserId } = data;
  await client.projectInstance.delete(
    `/collections/${collectionId}/entities/${entityId}`,
    { params: { actingUserId } }
  );
}

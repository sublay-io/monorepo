import { SublayHttpClient } from "../../core/client";
import { Collection } from "../../interfaces/Collection";

export interface FetchSubCollectionsProps {
  collectionId: string;
  actingUserId: string;
}

export interface FetchSubCollectionsResponse {
  data: Collection[];
}

/**
 * GET /collections/:collectionId/sub-collections — the collection's direct
 * children, oldest first (ties broken on id), each with its `entityCount`.
 */
export async function fetchSubCollections(
  client: SublayHttpClient,
  data: FetchSubCollectionsProps
): Promise<FetchSubCollectionsResponse> {
  const { collectionId, ...params } = data;
  const response = await client.projectInstance.get<FetchSubCollectionsResponse>(
    `/collections/${collectionId}/sub-collections`,
    { params }
  );
  return response.data;
}

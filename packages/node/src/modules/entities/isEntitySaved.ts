import { SublayHttpClient } from "../../core/client";

export interface IsEntitySavedProps {
  entityId: string;
  actingUserId: string;
}

export interface IsEntitySavedResponse {
  isSaved: boolean;
  /** The caller's collections that hold the entity (empty when not saved). */
  collections: { id: string; name: string }[];
}

/** GET /entities/:entityId/saved — whether the acting user saved the entity. */
export async function isEntitySaved(
  client: SublayHttpClient,
  data: IsEntitySavedProps
): Promise<IsEntitySavedResponse> {
  const { entityId, actingUserId } = data;
  const response = await client.projectInstance.get<IsEntitySavedResponse>(
    `/entities/${entityId}/saved`,
    { params: { actingUserId } }
  );
  return response.data;
}

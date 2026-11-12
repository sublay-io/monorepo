import { SublayHttpClient } from "../../core/client";

export interface IsEntitySavedProps {
  entityId: string;
}

export interface IsEntitySavedResponse {
  isSaved: boolean;
  /** The caller's collections that hold the entity (empty when not saved). */
  collections: { id: string; name: string }[];
}

export async function isEntitySaved(
  client: SublayHttpClient,
  data: IsEntitySavedProps
): Promise<IsEntitySavedResponse> {
  const response = await client.projectInstance.get<IsEntitySavedResponse>(
    "/entities/is-entity-saved",
    { params: data }
  );
  return response.data;
}

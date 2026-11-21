import { SublayHttpClient } from "../../core/client";

export interface ModerateSpaceEntityProps {
  spaceId: string;
  entityId: string;
  action: "approve" | "remove";
  reason?: string;
}

export interface ModerationResponse {
  // null when the target was deleted by its owner and never moderated:
  // deleted content takes no moderation change, so the response carries its
  // existing status.
  moderationStatus: "approved" | "removed" | null;
}

export async function moderateSpaceEntity(
  client: SublayHttpClient,
  data: ModerateSpaceEntityProps
): Promise<ModerationResponse> {
  const { spaceId, entityId, ...body } = data;
  const response = await client.projectInstance.patch<ModerationResponse>(
    `/spaces/${spaceId}/entities/${entityId}/moderation`,
    body
  );
  return response.data;
}

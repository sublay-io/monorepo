import { SublayHttpClient } from "../../core/client";

export interface ModerateSpaceEntityProps {
  spaceId: string;
  entityId: string;
  action: "approve" | "remove";
  reason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
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

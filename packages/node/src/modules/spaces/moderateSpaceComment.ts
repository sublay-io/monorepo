import { SublayHttpClient } from "../../core/client";
import { ModerationResponse } from "./moderateSpaceEntity";

export interface ModerateSpaceCommentProps {
  spaceId: string;
  commentId: string;
  action: "approve" | "remove";
  reason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function moderateSpaceComment(
  client: SublayHttpClient,
  data: ModerateSpaceCommentProps
): Promise<ModerationResponse> {
  const { spaceId, commentId, ...body } = data;
  const response = await client.projectInstance.patch<ModerationResponse>(
    `/spaces/${spaceId}/comments/${commentId}/moderation`,
    body
  );
  return response.data;
}

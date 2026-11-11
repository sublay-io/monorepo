import { SublayHttpClient } from "../../core/client";

export type CommentReportAction = "remove-comment" | "ban-user" | "dismiss";

export interface HandleCommentReportProps {
  spaceId: string;
  reportId: string;
  commentId: string;
  actions: CommentReportAction[];
  summary?: string;
  /** Why the user is banned, required when actions include "ban-user". The
   * banned user is always the author of the reported content. */
  reason?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

/** PATCH /spaces/:spaceId/reports/comment/:reportId — answers 204, no body. */
export async function handleCommentReport(
  client: SublayHttpClient,
  data: HandleCommentReportProps
): Promise<void> {
  const { spaceId, reportId, ...body } = data;
  await client.projectInstance.patch(
    `/spaces/${spaceId}/reports/comment/${reportId}`,
    body
  );
}

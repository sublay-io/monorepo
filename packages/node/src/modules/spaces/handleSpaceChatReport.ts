import { SublayHttpClient } from "../../core/client";

export type SpaceChatReportAction = "remove-message" | "ban-user" | "dismiss";

export interface HandleSpaceChatReportProps {
  spaceId: string;
  reportId: string;
  actions: SpaceChatReportAction[];
  summary?: string;
  /** Why the user is banned, required when actions include "ban-user". The
   * banned user is always the author of the reported content. */
  reason?: string;
  /** The message to remove, required when actions include "remove-message". */
  messageId?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

/** PATCH /spaces/:spaceId/chat/reports/:reportId — answers 204, no body. */
export async function handleSpaceChatReport(
  client: SublayHttpClient,
  data: HandleSpaceChatReportProps
): Promise<void> {
  const { spaceId, reportId, ...body } = data;
  await client.projectInstance.patch(
    `/spaces/${spaceId}/chat/reports/${reportId}`,
    body
  );
}

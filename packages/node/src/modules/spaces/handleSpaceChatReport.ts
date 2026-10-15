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
   * The moderator a service key acts for. The request then has exactly that
   * moderator's permissions. Omit it to act as the project.
   */
  actingUserId?: string;
}

export interface HandleSpaceChatReportResponse {
  message: string;
  code: string;
}

export async function handleSpaceChatReport(
  client: SublayHttpClient,
  data: HandleSpaceChatReportProps
): Promise<HandleSpaceChatReportResponse> {
  const { spaceId, reportId, ...body } = data;
  const response = await client.projectInstance.patch<HandleSpaceChatReportResponse>(
    `/spaces/${spaceId}/chat/reports/${reportId}`,
    body
  );
  return response.data;
}

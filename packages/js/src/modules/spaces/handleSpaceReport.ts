import { SublayHttpClient } from "../../core/client";

/**
 * Every action a space report can take. Which ones a report accepts depends on
 * its target: an entity report takes `remove-entity`, `ban-user`, `dismiss`; a
 * comment report `remove-comment`, `ban-user`, `dismiss`; a chat message report
 * `remove-message`, `ban-user`, `dismiss`. Any other is 400
 * `report/invalid-actions`.
 */
export type SpaceReportAction =
  | "remove-entity"
  | "remove-comment"
  | "remove-message"
  | "ban-user"
  | "dismiss";

export interface HandleSpaceReportProps {
  spaceId: string;
  reportId: string;
  actions: SpaceReportAction[];
  /** Up to 1000 characters. Required for entity and comment reports. */
  summary?: string;
  /** Why the user is banned (up to 1000 characters), required when actions
   * include `ban-user`. The banned user is always the author of the reported
   * content, read from the report. */
  reason?: string;
}

/**
 * PATCH /spaces/:spaceId/reports/:reportId — handle a report of any type; the
 * report's target is read from the report. Answers 204, no body.
 */
export async function handleSpaceReport(
  client: SublayHttpClient,
  data: HandleSpaceReportProps
): Promise<void> {
  const { spaceId, reportId, ...body } = data;
  await client.projectInstance.patch(
    `/spaces/${spaceId}/reports/${reportId}`,
    body
  );
}

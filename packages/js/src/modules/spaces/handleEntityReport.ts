import { SublayHttpClient } from "../../core/client";

export type EntityReportAction = "remove-entity" | "ban-user" | "dismiss";

export interface HandleEntityReportProps {
  spaceId: string;
  reportId: string;
  entityId: string;
  actions: EntityReportAction[];
  summary?: string;
  /** Why the user is banned, required when actions include "ban-user". The
   * banned user is always the author of the reported content. */
  reason?: string;
}

/** PATCH /spaces/:spaceId/reports/entity/:reportId — answers 204, no body. */
export async function handleEntityReport(
  client: SublayHttpClient,
  data: HandleEntityReportProps
): Promise<void> {
  const { spaceId, reportId, ...body } = data;
  await client.projectInstance.patch(
    `/spaces/${spaceId}/reports/entity/${reportId}`,
    body
  );
}

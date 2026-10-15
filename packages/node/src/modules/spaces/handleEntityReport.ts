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

export interface HandleReportResponse {
  message: string;
}

export async function handleEntityReport(
  client: SublayHttpClient,
  data: HandleEntityReportProps
): Promise<HandleReportResponse> {
  const { spaceId, reportId, ...body } = data;
  const response = await client.projectInstance.patch<HandleReportResponse>(
    `/spaces/${spaceId}/reports/entity/${reportId}`,
    body
  );
  return response.data;
}

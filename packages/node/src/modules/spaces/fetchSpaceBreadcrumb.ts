import { SublayHttpClient } from "../../core/client";
import { SpaceBreadcrumb } from "../../interfaces/Space";

export interface FetchSpaceBreadcrumbProps {
  spaceId: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get. Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchSpaceBreadcrumb(
  client: SublayHttpClient,
  data: FetchSpaceBreadcrumbProps
): Promise<SpaceBreadcrumb> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.get<SpaceBreadcrumb>(
    `/spaces/${spaceId}/breadcrumb`,
    { params: { actingUserId } }
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { FetchManyRulesResponse } from "../../interfaces/Rule";

export interface FetchManyRulesProps {
  spaceId: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get. Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchManyRules(
  client: SublayHttpClient,
  data: FetchManyRulesProps
): Promise<FetchManyRulesResponse> {
  const { spaceId, actingUserId } = data;
  const response = await client.projectInstance.get<FetchManyRulesResponse>(
    `/spaces/${spaceId}/rules`,
    { params: { actingUserId } }
  );
  return response.data;
}

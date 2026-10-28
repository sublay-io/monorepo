import { SublayHttpClient } from "../../core/client";
import { Rule } from "../../interfaces/Rule";

export interface FetchRuleProps {
  spaceId: string;
  ruleId: string;
  /**
   * Read as this user (service key only): exactly what their own access token
   * would get. Omit it for the anonymous view.
   */
  actingUserId?: string;
}

export async function fetchRule(
  client: SublayHttpClient,
  data: FetchRuleProps
): Promise<Rule> {
  const { spaceId, ruleId, actingUserId } = data;
  const response = await client.projectInstance.get<Rule>(
    `/spaces/${spaceId}/rules/${ruleId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

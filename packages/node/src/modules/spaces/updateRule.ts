import { SublayHttpClient } from "../../core/client";
import { Rule } from "../../interfaces/Rule";

export interface UpdateRuleProps {
  spaceId: string;
  ruleId: string;
  title?: string;
  description?: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function updateRule(
  client: SublayHttpClient,
  data: UpdateRuleProps
): Promise<Rule> {
  const { spaceId, ruleId, ...body } = data;
  const response = await client.projectInstance.patch<Rule>(
    `/spaces/${spaceId}/rules/${ruleId}`,
    body
  );
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Rule } from "../../interfaces/Rule";

export interface UpdateRuleProps {
  spaceId: string;
  ruleId: string;
  title?: string;
  description?: string | null;
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

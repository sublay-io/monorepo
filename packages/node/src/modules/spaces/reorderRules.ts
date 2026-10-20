import { SublayHttpClient } from "../../core/client";
import { Rule } from "../../interfaces/Rule";

export interface ReorderRulesProps {
  spaceId: string;
  ruleIds: string[];
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function reorderRules(
  client: SublayHttpClient,
  data: ReorderRulesProps
): Promise<Rule[]> {
  const { spaceId, ruleIds, actingUserId } = data;
  const response = await client.projectInstance.patch<Rule[]>(
    `/spaces/${spaceId}/rules/reorder`,
    { ruleIds, actingUserId }
  );
  return response.data;
}

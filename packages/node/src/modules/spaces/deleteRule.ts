import { SublayHttpClient } from "../../core/client";
import { DeleteRuleResponse } from "../../interfaces/Rule";

export interface DeleteRuleProps {
  spaceId: string;
  ruleId: string;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function deleteRule(
  client: SublayHttpClient,
  data: DeleteRuleProps
): Promise<DeleteRuleResponse> {
  const { spaceId, ruleId, actingUserId } = data;
  const response = await client.projectInstance.delete<DeleteRuleResponse>(
    `/spaces/${spaceId}/rules/${ruleId}`,
    { params: { actingUserId } }
  );
  return response.data;
}

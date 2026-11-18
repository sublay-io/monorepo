import { SublayHttpClient } from "../../core/client";

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
): Promise<void> {
  const { spaceId, ruleId, actingUserId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}/rules/${ruleId}`,
    { params: { actingUserId } }
  );
}

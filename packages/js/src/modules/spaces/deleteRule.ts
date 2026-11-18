import { SublayHttpClient } from "../../core/client";

export interface DeleteRuleProps {
  spaceId: string;
  ruleId: string;
}

export async function deleteRule(
  client: SublayHttpClient,
  data: DeleteRuleProps
): Promise<void> {
  const { spaceId, ruleId } = data;
  await client.projectInstance.delete<void>(
    `/spaces/${spaceId}/rules/${ruleId}`
  );
}

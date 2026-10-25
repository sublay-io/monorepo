import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  ChatMessage,
  ChatMessageIncludeParam,
} from "../../interfaces/ChatMessage";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface GetMessageProps extends SpaceReputationContextParams {
  conversationId: string;
  messageId: string;
  /**
   * Associations to populate. Only `"grants"` is supported here — it
   * attaches the message's reputation-grant summary. The message's files
   * always come back.
   */
  include?: ChatMessageIncludeParam;
}

export async function getMessage(
  client: SublayHttpClient,
  data: GetMessageProps
): Promise<ChatMessage> {
  const {
    conversationId,
    messageId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const params = {
    ...rest,
    include: serializeInclude(rest.include),
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<ChatMessage>(
    `/chat/conversations/${conversationId}/messages/${messageId}`,
    { params }
  );
  return response.data;
}

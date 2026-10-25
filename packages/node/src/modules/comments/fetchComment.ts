import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Comment, CommentIncludeParam } from "../../interfaces/Comment";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchCommentProps extends SpaceReputationContextParams {
  commentId: string;
  /**
   * Read as this user (service key only): the response is exactly what their
   * own access token would get (blocks, hidden posts, moderation details).
   * Omit it for the anonymous view.
   */
  actingUserId?: string;
  include?: CommentIncludeParam;
}

export async function fetchComment(
  client: SublayHttpClient,
  data: FetchCommentProps
): Promise<Comment> {
  const {
    commentId,
    spaceReputation,
    spaceReputationId,
    spaceReputationDescendants,
    ...rest
  } = data;
  const response = await client.projectInstance.get<Comment>(
    `/comments/${commentId}`,
    {
      params: {
        ...rest,
        include: serializeInclude(rest.include),
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  // v8 returns the comment bare (v7 wrapped it in { comment }, which the 7.x
  // SDK unwraps on main).
  return response.data;
}

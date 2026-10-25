import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { Comment, CommentIncludeParam } from "../../interfaces/Comment";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchCommentProps extends SpaceReputationContextParams {
  commentId: string;
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
  const params = {
    ...rest,
    include: serializeInclude(rest.include),
    ...buildSpaceReputationParams({
      spaceReputation,
      spaceReputationId,
      spaceReputationDescendants,
    }),
  };
  const response = await client.projectInstance.get<Comment>(
    `/comments/${commentId}`,
    { params }
  );
  // v8 returns the comment bare (v7 wrapped it in { comment }, which the 7.x
  // SDK unwraps on main).
  return response.data;
}

import { SublayHttpClient } from "../../core/client";
import { Comment } from "../../interfaces/Comment";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

export interface FetchCommentProps extends SpaceReputationContextParams {
  commentId: string;
  include?: string;
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
  const response = await client.projectInstance.get<{ comment: Comment }>(
    `/comments/${commentId}`,
    {
      params: {
        ...rest,
        ...buildSpaceReputationParams({
          spaceReputation,
          spaceReputationId,
          spaceReputationDescendants,
        }),
      },
    }
  );
  // The v7 server wraps single-comment reads in { comment } (the only
  // single-record read that does); unwrap so callers get the Comment itself.
  return response.data.comment;
}

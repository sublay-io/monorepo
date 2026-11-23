import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Comment, GifData } from "../../interfaces/models/Comment";
import { Mention } from "../../interfaces/models/Mention";
import { useUser } from "../user";

export interface CreateCommentProps {
  entityId: string;
  foreignId?: string;
  parentCommentId?: string | null;
  content?: string | null;
  gif?: GifData | null;
  mentions?: Mention[];
  referencedCommentId?: string;
  attachments?: Record<string, any>[];
  metadata?: Record<string, any>;
}

// Hook for adding a comment
function useCreateComment(): (props: CreateCommentProps) => Promise<Comment> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();
  const { user } = useUser();

  const createComment = useCallback(
    async (props: CreateCommentProps) => {
      const {
        entityId,
        foreignId,
        parentCommentId,
        content,
        gif,
        mentions,
        referencedCommentId,
        attachments,
        metadata,
      } = props;
      if (!projectId) {
        throw new Error("No project specified");
      }

      if (!entityId) {
        throw new Error("No entity ID was provided");
      }

      if (!user) {
        throw new Error("No authenticated user");
      }

      // The server needs at least one of content, a gif, or attachments.
      if (!content?.trim() && !gif && !attachments?.length) {
        throw new Error("No content, gif or attachments were provided");
      }

      const response = await axios.post(`/${projectId}/comments`, {
        entityId,
        foreignId,
        content,
        gif,
        mentions,
        parentCommentId,
        referencedCommentId,
        attachments,
        metadata,
      });
      return response.data as Comment;
    },
    [projectId, user, axios]
  );

  return createComment;
}

export default useCreateComment;

import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Comment, GifData } from "../../interfaces/models/Comment";
import { Mention } from "../../interfaces/models/Mention";
import { useUser } from "../user";
import {
  appendFileList,
  appendImageList,
  hasListFiles,
  type FileListUpload,
  type ImageListUpload,
} from "../../utils/uploads";
import { SublayError } from "../../errors/SublayError";

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
  /**
   * Images on the comment, processed into sizes per `options` (`mode` is
   * required). Sends multipart. Requires the files-images bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the comment, stored as uploaded. Sends multipart. Requires the
   * files-images bundle.
   */
  files?: FileListUpload;
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
        images,
        files,
      } = props;
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!entityId) {
        throw new SublayError("No entity ID was provided");
      }

      if (!user) {
        throw new SublayError("No authenticated user");
      }

      const hasImages = hasListFiles(images);
      const hasFiles = hasListFiles(files);

      // The server needs at least one of content, a gif, attachments, images
      // or files.
      if (
        !content?.trim() &&
        !gif &&
        !attachments?.length &&
        !hasImages &&
        !hasFiles
      ) {
        throw new SublayError(
          "No content, gif, attachments, images or files were provided"
        );
      }

      if (hasImages || hasFiles) {
        // Multipart: object fields as JSON strings (the server parses them
        // back). A multipart field can't carry null, and on a create a null
        // field means the same as leaving it out.
        const formData = new FormData();
        formData.append("entityId", entityId);
        if (foreignId != null) formData.append("foreignId", foreignId);
        if (content != null) formData.append("content", content);
        if (gif != null) formData.append("gif", JSON.stringify(gif));
        if (mentions !== undefined) formData.append("mentions", JSON.stringify(mentions));
        if (parentCommentId != null) formData.append("parentCommentId", parentCommentId);
        if (referencedCommentId !== undefined)
          formData.append("referencedCommentId", referencedCommentId);
        if (attachments !== undefined)
          formData.append("attachments", JSON.stringify(attachments));
        if (metadata !== undefined) formData.append("metadata", JSON.stringify(metadata));

        if (hasImages) appendImageList(formData, images!);
        if (hasFiles) appendFileList(formData, files!);

        const response = await axios.post(`/${projectId}/comments`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data as Comment;
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

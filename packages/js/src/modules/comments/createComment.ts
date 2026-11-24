import { SublayHttpClient } from "../../core/client";
import { Comment, GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";
import {
  appendFields,
  appendListUploads,
  hasListUploads,
  withoutNulls,
  type FileListUpload,
  type ImageListUpload,
} from "../../core/multipart";

export interface CreateCommentProps {
  entityId: string;
  foreignId?: string;
  content?: string | null;
  gif?: GifData | null;
  mentions?: Mention[];
  parentCommentId?: string | null;
  referencedCommentId?: string;
  attachments?: Record<string, any>[];
  metadata?: Record<string, any>;
  /**
   * Images on the comment, processed into sizes per `options` (`mode` is
   * required). When present the request is sent as `multipart/form-data`.
   * Requires the `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the comment, stored as uploaded. When present the request is
   * sent as `multipart/form-data`. Requires the `files-images` bundle.
   */
  files?: FileListUpload;
}

export async function createComment(
  client: SublayHttpClient,
  data: CreateCommentProps
): Promise<Comment> {
  const { images, files, ...body } = data;

  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    appendListUploads(formData, { images, files });
    // Object fields go as JSON strings (the server parses them back). On a
    // create a null field means the same as leaving it out.
    appendFields(formData, withoutNulls(body));
    const response = await client.projectInstance.post<Comment>(
      "/comments",
      formData
    );
    return response.data;
  }

  const response = await client.projectInstance.post<Comment>(
    "/comments",
    body
  );
  return response.data;
}

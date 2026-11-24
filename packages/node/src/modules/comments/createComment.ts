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
} from "../../core/formData";

export interface CreateCommentProps {
  foreignId?: string;
  actingUserId: string;
  entityId: string;
  content?: string | null;
  gif?: GifData | null;
  mentions?: Mention[];
  parentCommentId?: string | null;
  referencedCommentId?: string;
  attachments?: Record<string, any>[];
  metadata?: Record<string, any>;
  /**
   * Backdate the comment: a `Date`, or a full UTC timestamp string such as
   * `"2024-03-01T12:00:00.000Z"` (`date.toISOString()`).
   */
  createdAt?: string | Date;
  /** Backdate the comment's last update; same format as `createdAt`. */
  updatedAt?: string | Date;
  /**
   * Images on the comment, processed into sizes per `options` (`mode` is required).
   * Each carries its bytes and, for raw bytes, a `filename` and `mimeType`.
   * When present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  images?: ImageListUpload;
  /**
   * Files on the comment, stored as uploaded (`options.pathParts` optional). When
   * present the request is sent as `multipart/form-data`. Requires the
   * `files-images` bundle.
   */
  files?: FileListUpload;
}

export async function createComment(
  client: SublayHttpClient,
  data: CreateCommentProps
): Promise<Comment> {
  const path = `/comments`;
  const { images, files, ...body } = data;

  if (hasListUploads({ images, files })) {
    const formData = new FormData();
    // Object fields go as JSON strings (the server parses them back). On a
    // create a null field means the same as leaving it out.
    appendFields(formData, withoutNulls(body));
    appendListUploads(formData, { images, files });
    const response = await client.projectInstance.post<Comment>(path, formData);
    return response.data;
  }

  const response = await client.projectInstance.post<Comment>(path, body);
  return response.data;
}

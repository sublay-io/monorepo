import { SublayHttpClient } from "../../core/client";
import { Comment, GifData } from "../../interfaces/Comment";
import { Mention } from "../../interfaces/Mention";

export interface CreateCommentProps {
  foreignId?: string;
  actingUserId: string;
  entityId: string;
  content?: string;
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
}

export async function createComment(
  client: SublayHttpClient,
  data: CreateCommentProps
): Promise<Comment> {
  const path = `/comments`; // assuming client handles prefix like /{projectId}
  const response = await client.projectInstance.post<Comment>(path, data);
  return response.data;
}

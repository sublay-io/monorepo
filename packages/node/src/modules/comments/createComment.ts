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
  /** Backdate the comment, as an ISO 8601 UTC timestamp (e.g. `date.toISOString()`). */
  createdAt?: string;
  /** Backdate the comment's last update, as an ISO 8601 UTC timestamp. */
  updatedAt?: string;
}

export async function createComment(
  client: SublayHttpClient,
  data: CreateCommentProps
): Promise<Comment> {
  const path = `/comments`; // assuming client handles prefix like /{projectId}
  const response = await client.projectInstance.post<Comment>(path, data);
  return response.data;
}

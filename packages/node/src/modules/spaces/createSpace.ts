import { SublayHttpClient } from "../../core/client";
import {
  Space,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/Space";

export interface CreateSpaceProps {
  /**
   * The user the service key creates the space as: its creator and first
   * admin, held to that user's own permissions (a child space needs them to
   * be an admin of the parent).
   */
  actingUserId: string;
  name: string;
  slug?: string;
  description?: string;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  parentSpaceId?: string;
  metadata?: Record<string, any>;
  nsfw?: boolean;
}

export async function createSpace(
  client: SublayHttpClient,
  data: CreateSpaceProps
): Promise<Space> {
  const response = await client.projectInstance.post<Space>("/spaces", data);
  return response.data;
}

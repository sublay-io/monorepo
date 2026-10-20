import { SublayHttpClient } from "../../core/client";
import {
  Space,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/Space";

export interface UpdateSpaceProps {
  spaceId: string;
  name?: string;
  slug?: string;
  description?: string;
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  /**
   * The user this request acts as. The request has exactly that user's
   * permissions in the space and is recorded as theirs. Required.
   */
  actingUserId: string;
}

export async function updateSpace(
  client: SublayHttpClient,
  data: UpdateSpaceProps
): Promise<Space> {
  const { spaceId, ...body } = data;
  const response = await client.projectInstance.patch<Space>(
    `/spaces/${spaceId}`,
    body
  );
  return response.data;
}

import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { UserSpacesResponse, SpaceIncludeParam } from "../../interfaces/Space";
import { SpaceSearchParams } from "../../interfaces/SpaceSearch";

export interface FetchUserSpacesProps extends SpaceSearchParams {
  actingUserId: string;
  page?: number;
  limit?: number;
  /** Left out: `"joinedAt"` (when the user joined each space, most recent first). */
  sortBy?: "joinedAt" | "createdAt" | "alphabetical" | "members";
  sortDir?: "asc" | "desc";
  include?: SpaceIncludeParam;
  role?: string; // single role or comma-separated, e.g. "admin,moderator"
  all?: "true" | "false";
  /**
   * Membership status to list. Defaults to `"active"` (spaces the user is in);
   * `"pending"` returns join requests awaiting approval, `"banned"` the spaces
   * they were removed from.
   */
  status?: "active" | "pending" | "banned";
  /**
   * Narrows the list by where each space sits in the tree:
   * `"none"` returns the user's memberships in top-level spaces only; a space
   * id returns their memberships in that space's direct sub-spaces. `"any"`
   * or left out: memberships at every level (the default). A membership in a
   * sub-space whose parent the user isn't in is not top-level, so `"none"`
   * leaves it out.
   */
  parentSpaceId?: string | "none" | "any";
}

export async function fetchUserSpaces(
  client: SublayHttpClient,
  data: FetchUserSpacesProps
): Promise<UserSpacesResponse> {
  const response = await client.projectInstance.get<UserSpacesResponse>(
    "/spaces/user-spaces",
    { params: { ...data, include: serializeInclude(data.include) } }
  );
  return response.data;
}

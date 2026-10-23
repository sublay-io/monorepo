import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import { UserSpacesResponse, SpaceIncludeParam } from "../../interfaces/Space";

export interface FetchUserSpacesProps {
  page?: number;
  limit?: number;
  sortBy?: "createdAt" | "alphabetical" | "members" | "joinedAt";
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

import { useCallback } from "react";
import useProject from "../projects/useProject";
import { UserSpacesResponse, SpaceIncludeParam } from "../../interfaces/models/Space";
import { SpaceMemberRole } from "../../interfaces/models/SpaceMember";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import { UserSpacesSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
import { buildSearchParams } from "../../utils/searchParams";

export interface FetchUserSpacesProps {
  page?: number;
  limit?: number;
  status?: "active" | "pending" | "banned";
  role?: SpaceMemberRole | SpaceMemberRole[];
  all?: boolean;
  /**
   * Text search over the user's spaces. Blank or left out: no filter, and
   * `searchFields` is left out with it.
   */
  query?: string | null;
  /** The space field `query` matches. Left out: `slug`, `name` or `description`. */
  searchFields?: SpaceSearchFields | null;
  /** Server default `"joinedAt"` (most recently joined first). */
  sortBy?: UserSpacesSortByOptions;
  sortDir?: "asc" | "desc";
  include?: SpaceIncludeParam;
  /**
   * Narrows the list by where each space sits in the tree:
   * `"none"` returns the user's memberships in top-level spaces only; a space
   * id returns their memberships in that space's direct sub-spaces. Left out
   * or `null`: memberships at every level (`null` is never sent as `"none"`).
   * A membership in a sub-space whose parent the user isn't in is not
   * top-level, so `"none"` leaves it out.
   */
  parentSpaceId?: string | "none" | null;
}

function useFetchUserSpaces(): (params?: FetchUserSpacesProps) => Promise<UserSpacesResponse> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchUserSpaces = useCallback(
    async (params: FetchUserSpacesProps = {}) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const { include, role, query, searchFields, parentSpaceId, ...rest } = params;

      const response = await axios.get<UserSpacesResponse>(
        `/${projectId}/spaces/user-spaces`,
        {
          params: {
            ...rest,
            ...buildSearchParams(query, searchFields),
            include: Array.isArray(include) ? include.join(",") : include,
            role: Array.isArray(role) ? role.join(",") : role,
            // `null` means not set: left out, never turned into "none".
            ...(parentSpaceId != null ? { parentSpaceId } : {}),
          },
        }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchUserSpaces;
}

export default useFetchUserSpaces;

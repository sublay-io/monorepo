import { baseApi } from "./baseApi";
import { buildSearchParams } from "../../utils/searchParams";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
import type {
  Space,
  DeleteSpaceResponse,
} from "../../interfaces/models/Space";
import type { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

// This module exists solely to back the space-list feature (`useSpaceList` /
// `useSpaceListActions`). Every other spaces operation is served by the public
// axios hooks in `hooks/spaces/` — do not add endpoints here to mirror them.

// ===== API Parameter Types =====

interface CreateSpaceParams {
  projectId: string;
  name: string;
  slug?: string | null;
  description?: string | null;
  // No avatar/banner here: the server dropped URL-string image fields in
  // favour of multipart `avatarFile`/`bannerFile` uploads, which this RTK
  // Query layer cannot send (baseApi pins Content-Type to application/json).
  // Use `useCreateSpace` / `useUpdateSpace` to set space images.
  readingPermission?: "anyone" | "members";
  postingPermission?: "anyone" | "members" | "admins";
  visibility?: "public" | "unlisted" | "private";
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  parentSpaceId?: string | null;
}

interface FetchSpacesParams {
  projectId: string;
  page?: number;
  limit?: number;
  sortBy?: SpaceListSortByOptions;
  sortDir?: "asc" | "desc";
  query?: string | null;
  searchFields?: SpaceSearchFields | null;
  // No readingPermission filter: it governs who can read a space's contents,
  // not which spaces are discoverable. The server returns all spaces
  // regardless of it — discoverability is driven by `visibility`, which the
  // server derives from the caller rather than accepting as a filter.
  memberOf?: boolean;
  /**
   * A space id (its child spaces), or `"none"` for top-level spaces only.
   * `null` or left out: the default, `"none"`.
   */
  parentSpaceId?: string | "none" | null;
}

interface DeleteSpaceParams {
  projectId: string;
  spaceId: string;
}

// ===== API Endpoints =====

export const spacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    // Create a new space
    createSpace: builder.mutation<Space, CreateSpaceParams>({
      query: ({ projectId, ...body }) => ({
        url: `/${projectId}/spaces`,
        method: "POST",
        body,
      }),
      invalidatesTags: () => [{ type: "Space", id: "LIST" }],
    }),

    // Fetch many spaces (list with filters)
    fetchSpaces: builder.query<PaginatedResponse<Space>, FetchSpacesParams>({
      query: ({ projectId, ...params }) => {
        const queryParams = new URLSearchParams();

        if (params.page !== undefined) queryParams.append("page", params.page.toString());
        if (params.limit !== undefined) queryParams.append("limit", params.limit.toString());
        if (params.sortBy) queryParams.append("sortBy", params.sortBy);
        if (params.sortDir) queryParams.append("sortDir", params.sortDir);
        const search = buildSearchParams(params.query, params.searchFields);
        if (search.query) queryParams.append("query", search.query);
        if (search.searchFields) queryParams.append("searchFields", search.searchFields);
        // Sent as "true" / "false"; "false" lists the same as leaving it out.
        if (typeof params.memberOf === "boolean") queryParams.append("memberOf", String(params.memberOf));
        // Top-level spaces unless a parent is named; sent on every page.
        queryParams.append("parentSpaceId", params.parentSpaceId ?? "none");

        return {
          url: `/${projectId}/spaces?${queryParams.toString()}`,
          method: "GET",
        };
      },
      providesTags: (result) => [
        { type: "Space", id: "LIST" },
        ...(result?.data?.map(({ id }) => ({ type: "Space" as const, id })) ?? []),
      ],
    }),

    // Delete space
    deleteSpace: builder.mutation<DeleteSpaceResponse, DeleteSpaceParams>({
      query: ({ projectId, spaceId }) => ({
        url: `/${projectId}/spaces/${spaceId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, { spaceId }) => [
        { type: "Space", id: spaceId },
        { type: "Space", id: "LIST" },
      ],
    }),
  }),
});

// Export hooks for use in components
export const {
  useCreateSpaceMutation,
  useFetchSpacesQuery,
  useLazyFetchSpacesQuery,
  useDeleteSpaceMutation,
} = spacesApi;

// Export for manual cache management
export const { createSpace, fetchSpaces, deleteSpace } = spacesApi.endpoints;

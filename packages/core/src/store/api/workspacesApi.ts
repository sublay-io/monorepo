import { baseApi } from "./baseApi";
import type {
  Workspace,
  WorkspaceInclude,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/models/Workspace";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

// This module exists solely to back the workspace-list feature
// (`useWorkspaceList` / `useWorkspaceListActions`). Every other workspaces
// operation is served by the public axios hooks in `hooks/workspaces/` — do not
// add endpoints here to mirror them.
//
// No cache tags: the list lives in the `workspaceLists` slice, and the lazy
// list query always refetches, so invalidation would only add a request.

// ===== API Parameter Types =====

interface CreateWorkspaceParams {
  projectId: string;
  name: string;
  metadata?: Record<string, any>;
  parentWorkspaceId?: string | null;
}

interface FetchWorkspacesParams {
  projectId: string;
  page?: number;
  limit?: number;
  relation?: WorkspaceListRelation | null;
  parentWorkspaceId?: string | "none" | "any" | null;
  sortDir?: WorkspaceListSortDir | null;
  include?: WorkspaceInclude[] | null;
}

interface FetchWorkspaceParams {
  projectId: string;
  workspaceId: string;
  include?: WorkspaceInclude[] | null;
}

interface DeleteWorkspaceParams {
  projectId: string;
  workspaceId: string;
}

// The workspaces endpoints refuse an undeclared or `null` query value with a
// 400, so only set values are sent.
function buildQuery(params: Record<string, string | number | null | undefined>) {
  const query = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      query.append(key, String(value));
    }
  });
  const text = query.toString();
  return text ? `?${text}` : "";
}

// ===== API Endpoints =====

export const workspacesApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    createWorkspace: builder.mutation<Workspace, CreateWorkspaceParams>({
      query: ({ projectId, ...body }) => ({
        url: `/${projectId}/workspaces`,
        method: "POST",
        body,
      }),
    }),

    fetchWorkspaces: builder.query<
      PaginatedResponse<Workspace>,
      FetchWorkspacesParams
    >({
      query: ({ projectId, include, ...params }) => ({
        url: `/${projectId}/workspaces${buildQuery({
          page: params.page,
          limit: params.limit,
          relation: params.relation,
          parentWorkspaceId: params.parentWorkspaceId,
          sortDir: params.sortDir,
          include: include?.length ? include.join(",") : undefined,
        })}`,
        method: "GET",
      }),
    }),

    fetchWorkspace: builder.query<Workspace, FetchWorkspaceParams>({
      query: ({ projectId, workspaceId, include }) => ({
        url: `/${projectId}/workspaces/${workspaceId}${buildQuery({
          include: include?.length ? include.join(",") : undefined,
        })}`,
        method: "GET",
      }),
    }),

    deleteWorkspace: builder.mutation<{ message: string }, DeleteWorkspaceParams>(
      {
        query: ({ projectId, workspaceId }) => ({
          url: `/${projectId}/workspaces/${workspaceId}`,
          method: "DELETE",
        }),
      }
    ),
  }),
});

export const {
  useCreateWorkspaceMutation,
  useFetchWorkspacesQuery,
  useLazyFetchWorkspacesQuery,
  useLazyFetchWorkspaceQuery,
  useDeleteWorkspaceMutation,
} = workspacesApi;

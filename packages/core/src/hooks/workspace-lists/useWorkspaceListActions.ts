import { useCallback } from "react";
import { useSublayDispatch } from "../../store/hooks";
import {
  setWorkspaceListLoading,
  setWorkspaceListWorkspaces,
  setWorkspaceListHasMore,
  setWorkspaceListError,
  addWorkspace,
  removeWorkspace,
} from "../../store/slices/workspaceListsSlice";
import {
  useLazyFetchWorkspacesQuery,
  useLazyFetchWorkspaceQuery,
  useCreateWorkspaceMutation,
  useDeleteWorkspaceMutation,
} from "../../store/api/workspacesApi";
import { handleError as handleErrorUtil } from "../../utils/handleError";
import useProject from "../projects/useProject";
import type {
  Workspace,
  WorkspaceInclude,
  WorkspaceListRelation,
  WorkspaceListSortDir,
} from "../../interfaces/models/Workspace";

export interface FetchWorkspacesOptions {
  page: number;
  limit: number;
  /** `"reachable"` or `"direct"`. `null` or left out: not sent (`"reachable"`). */
  relation?: WorkspaceListRelation | null;
  /**
   * A workspace id (the workspaces directly under it), `"none"` (top-level
   * workspaces) or `"any"` (every level). `null` or left out: not sent
   * (every level).
   */
  parentWorkspaceId?: string | "none" | "any" | null;
  /** `"desc"` or `"asc"`. `null` or left out: not sent (`"desc"`). */
  sortDir?: WorkspaceListSortDir | null;
  include?: WorkspaceInclude[] | null;
}

export interface CreateWorkspaceOptions {
  name: string;
  metadata?: Record<string, any>;
  /** The parent for a sub-workspace; left out or `null` for a top-level one. */
  parentWorkspaceId?: string | null;
  /**
   * Include flags for the follow-up read of the new workspace, so its row
   * matches the list's other rows (`useWorkspaceList` passes the list's own).
   */
  include?: WorkspaceInclude[] | null;
}

export interface DeleteWorkspaceOptions {
  workspaceId: string;
}

export function useWorkspaceListActions() {
  const dispatch = useSublayDispatch();
  const { projectId } = useProject();

  const [triggerFetchWorkspaces] = useLazyFetchWorkspacesQuery();
  const [triggerFetchWorkspace] = useLazyFetchWorkspaceQuery();
  const [createWorkspaceMutation] = useCreateWorkspaceMutation();
  const [deleteWorkspaceMutation] = useDeleteWorkspaceMutation();

  const fetchWorkspaces = useCallback(
    async (
      listId: string,
      options: FetchWorkspacesOptions
    ): Promise<Workspace[] | null> => {
      if (!projectId) {
        throw new Error("No project ID available");
      }

      dispatch(setWorkspaceListLoading({ listId, loading: true }));

      try {
        const result = await triggerFetchWorkspaces({
          projectId,
          page: options.page,
          limit: options.limit,
          relation: options.relation,
          parentWorkspaceId: options.parentWorkspaceId,
          sortDir: options.sortDir,
          include: options.include,
        }).unwrap();

        if (result) {
          const append = options.page > 1;
          dispatch(
            setWorkspaceListWorkspaces({
              listId,
              workspaces: result.data,
              append,
            })
          );
          dispatch(
            setWorkspaceListHasMore({
              listId,
              hasMore: result.pagination.hasMore,
            })
          );
          return result.data;
        }

        return null;
      } catch (err) {
        console.error(
          `[WorkspaceListActions] Failed to fetch workspaces for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to fetch workspaces:");
        dispatch(
          setWorkspaceListError({ listId, error: "Failed to fetch workspaces" })
        );
        throw err;
      } finally {
        dispatch(setWorkspaceListLoading({ listId, loading: false }));
      }
    },
    [dispatch, projectId, triggerFetchWorkspaces]
  );

  /**
   * Creates the workspace, then reads it back so the row carries `reasons`
   * (and `memberCount` when asked) like the list's other rows, and adds it to
   * the list where the server would list it. If the read-back fails, the row
   * from the create is added without them.
   */
  const createWorkspace = useCallback(
    async (
      listId: string,
      options: CreateWorkspaceOptions
    ): Promise<Workspace | undefined> => {
      if (!projectId) {
        throw new Error("No project ID available");
      }

      if (!options.name) {
        throw new Error("Workspace name is required");
      }

      try {
        const { include, ...createData } = options;

        const created = await createWorkspaceMutation({
          projectId,
          ...createData,
        }).unwrap();

        let workspace: Workspace = created;
        try {
          workspace = await triggerFetchWorkspace({
            projectId,
            workspaceId: created.id,
            include,
          }).unwrap();
        } catch (readErr) {
          console.error(
            `[WorkspaceListActions] Created workspace ${created.id} but could not read it back for listId: ${listId}`,
            readErr
          );
        }

        dispatch(addWorkspace({ listId, workspace }));

        return workspace;
      } catch (err) {
        console.error(
          `[WorkspaceListActions] Failed to create workspace for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to create workspace:");
        throw err;
      }
    },
    [dispatch, projectId, createWorkspaceMutation, triggerFetchWorkspace]
  );

  const deleteWorkspace = useCallback(
    async (listId: string, options: DeleteWorkspaceOptions): Promise<void> => {
      if (!projectId) {
        throw new Error("No project ID available");
      }

      if (!options.workspaceId) {
        throw new Error("Workspace ID is required");
      }

      try {
        await deleteWorkspaceMutation({
          projectId,
          workspaceId: options.workspaceId,
        }).unwrap();

        dispatch(removeWorkspace({ listId, workspaceId: options.workspaceId }));
      } catch (err) {
        console.error(
          `[WorkspaceListActions] Failed to delete workspace for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to delete workspace:");
        throw err;
      }
    },
    [dispatch, projectId, deleteWorkspaceMutation]
  );

  return {
    fetchWorkspaces,
    createWorkspace,
    deleteWorkspace,
  };
}

export default useWorkspaceListActions;

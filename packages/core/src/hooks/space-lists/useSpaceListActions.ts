import { useCallback } from "react";
import type { SpaceSearchFields } from "../../interfaces/SpaceSearch";
import { useSublayDispatch } from "../../store/hooks";
import {
  setSpaceListLoading,
  setSpaceListSpaces,
  setSpaceListHasMore,
  setSpaceListError,
  addSpace,
  removeSpace,
} from "../../store/slices/spaceListsSlice";
import {
  useLazyFetchSpacesQuery,
  useCreateSpaceMutation,
  useDeleteSpaceMutation,
} from "../../store/api/spacesApi";
import { handleError as handleErrorUtil } from "../../utils/handleError";
import useProject from "../projects/useProject";
import type {
  Space,
  SpaceWithPermissions,
  ReadingPermission,
  PostingPermission,
  SpaceVisibility,
} from "../../interfaces/models/Space";
import type { SpaceListSortByOptions } from "../../interfaces/SpaceListSortByOptions";
import type { SortDirection } from "../../interfaces/EntityListSortByOptions";
import { SublayError, rethrowAsSublayError, toSublayError } from "../../errors/SublayError";

export interface FetchSpacesOptions {
  page: number;
  sortBy: SpaceListSortByOptions;
  sortDir?: SortDirection | null;
  query?: string | null;
  searchFields?: SpaceSearchFields | null;
  /**
   * A space id (its direct sub-spaces), `"none"` (top-level spaces) or `"any"`
   * (every level). `null` or left out: `"none"`.
   */
  parentSpaceId?: string | "none" | "any" | null;
  limit: number;
}

export interface CreateSpaceOptions {
  // `null` is the same as leaving the field out.
  name?: string | null;
  slug?: string | null;
  description?: string | null;
  // Space images are multipart-only on the server; set them with
  // `useCreateSpace` / `useUpdateSpace` rather than through the list actions.
  readingPermission?: ReadingPermission;
  postingPermission?: PostingPermission;
  visibility?: SpaceVisibility;
  requireJoinApproval?: boolean;
  metadata?: Record<string, any>;
  nsfw?: boolean;
  parentSpaceId?: string | null;
  insertPosition?: "first" | "last";
}

export interface DeleteSpaceOptions {
  spaceId: string;
}

export interface UseSpaceListActionsValues {
  fetchSpaces: (props: { listId: string } & FetchSpacesOptions) => Promise<Space[] | null>;
  createSpace: (props: { listId: string } & CreateSpaceOptions) => Promise<SpaceWithPermissions | undefined>;
  deleteSpace: (props: { listId: string } & DeleteSpaceOptions) => Promise<void>;
}

/**
 * The implementation: `fetchSpaces` also takes the list hooks' internal
 * `isCurrent` guard as a second argument (a load superseded meanwhile writes
 * nothing). Internal — not exported from the package.
 */
export function useSpaceListActionsWithGuard() {
  const dispatch = useSublayDispatch();

  // Get project context
  const { projectId } = useProject();

  // RTK Query hooks
  const [triggerFetchSpaces] = useLazyFetchSpacesQuery();
  const [createSpaceMutation] = useCreateSpaceMutation();
  const [deleteSpaceMutation] = useDeleteSpaceMutation();

  // Fetch spaces action
  const fetchSpaces = useCallback(
    async (
      { listId, ...options }: { listId: string } & FetchSpacesOptions,
      isCurrent: () => boolean = () => true
    ): Promise<Space[] | null> => {
      if (!projectId) {
        throw new SublayError("No project ID available");
      }

      if (!options.sortBy) {
        console.warn("sortBy is required for fetching spaces");
        return null;
      }

      dispatch(setSpaceListLoading({ listId, loading: true }));

      try {
        const result = await triggerFetchSpaces({
          projectId,
          page: options.page,
          sortBy: options.sortBy,
          sortDir: options.sortDir ?? undefined,
          query: options.query,
          searchFields: options.searchFields,
          parentSpaceId: options.parentSpaceId,
          limit: options.limit,
        }).unwrap().catch(rethrowAsSublayError);

        // A newer load (or a reset) replaced this one: it writes nothing.
        if (!isCurrent()) return null;

        if (result) {
          const append = options.page > 1;
          dispatch(setSpaceListSpaces({ listId, spaces: result.data, append }));
          dispatch(
            setSpaceListHasMore({
              listId,
              hasMore: result.pagination.hasMore,
            })
          );
          return result.data;
        }

        return null;
      } catch (err) {
        if (!isCurrent()) throw err;
        console.error(
          `[SpaceListActions] Failed to fetch spaces for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to fetch spaces:");
        dispatch(
          setSpaceListError({ listId, error: "Failed to fetch spaces" })
        );
        throw toSublayError(err);
      } finally {
        if (isCurrent()) dispatch(setSpaceListLoading({ listId, loading: false }));
      }
    },
    [dispatch, projectId, triggerFetchSpaces]
  );

  // Create space action
  const createSpace = useCallback(
    async ({
      listId,
      ...options
    }: { listId: string } & CreateSpaceOptions): Promise<SpaceWithPermissions | undefined> => {
      if (!projectId) {
        throw new SublayError("No project ID available");
      }

      try {
        const { insertPosition, ...createData } = options;

        const newSpace = await createSpaceMutation({
          projectId,
          ...createData,
        }).unwrap().catch(rethrowAsSublayError);

        // Optimistically add to the list
        dispatch(
          addSpace({
            listId,
            space: newSpace,
            insertPosition: insertPosition || "first",
          })
        );

        return newSpace;
      } catch (err) {
        console.error(
          `[SpaceListActions] Failed to create space for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to create space:");
        throw toSublayError(err);
      }
    },
    [dispatch, projectId, createSpaceMutation]
  );

  // Delete space action
  const deleteSpace = useCallback(
    async ({ listId, ...options }: { listId: string } & DeleteSpaceOptions): Promise<void> => {
      if (!projectId) {
        throw new SublayError("No project ID available");
      }

      if (!options.spaceId) {
        throw new SublayError("Space ID is required");
      }

      try {
        await deleteSpaceMutation({
          projectId,
          spaceId: options.spaceId,
        }).unwrap().catch(rethrowAsSublayError);

        // Remove from the list
        dispatch(
          removeSpace({
            listId,
            spaceId: options.spaceId,
          })
        );
      } catch (err) {
        console.error(
          `[SpaceListActions] Failed to delete space for listId: ${listId}`,
          err
        );
        handleErrorUtil(err, "Failed to delete space:");
        throw toSublayError(err);
      }
    },
    [dispatch, projectId, deleteSpaceMutation]
  );

  return {
    fetchSpaces,
    createSpace,
    deleteSpace,
  };
}

/** The list's low-level actions. Each takes one object: `{ listId, ... }`. */
export function useSpaceListActions(): UseSpaceListActionsValues {
  return useSpaceListActionsWithGuard();
}

export default useSpaceListActions;

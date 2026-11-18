import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useStableObject } from "../useStableObject";

import useFetchSpace from "./useFetchSpace";
import useFetchSpaceByShortId from "./useFetchSpaceByShortId";
import useFetchSpaceBySlug from "./useFetchSpaceBySlug";
import useFetchSpaceBreadcrumb from "./useFetchSpaceBreadcrumb";
import type { SpaceBreadcrumbEntry } from "../../interfaces/SpaceBreadcrumb";
import useUpdateSpace, { UpdateSpaceProps } from "./useUpdateSpace";
import useDeleteSpace from "./useDeleteSpace";
import useJoinSpace from "./useJoinSpace";
import useLeaveSpace from "./useLeaveSpace";
import useSpacePermissions from "./useSpacePermissions";

import {
  SpaceDetailed,
  SpaceIncludeParam,
  SpacePreview,
  SpaceWithPermissions,
} from "../../interfaces/models/Space";
import { SpaceMemberStatus } from "../../interfaces/models/SpaceMember";
import { handleError } from "../../utils/handleError";

export interface UseSpaceDataProps {
  space?: SpaceDetailed;
  spaceId?: string | undefined | null;
  shortId?: string | undefined | null;
  slug?: string | undefined | null;
  include?: SpaceIncludeParam;
}

export interface UseSpaceDataValues {
  space: SpaceDetailed | null | undefined;
  setSpace: React.Dispatch<React.SetStateAction<SpaceDetailed | null | undefined>>;

  // Permissions
  isMember: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canPost: boolean;
  canModerate: boolean;
  canRead: boolean;
  membershipStatus: SpaceMemberStatus | null;
  isPending: boolean;
  isBanned: boolean;

  // Hierarchy
  // Root first. A space above that the viewer can't see is `{ hidden: true }`.
  breadcrumb: SpaceBreadcrumbEntry[];
  parentSpace: SpacePreview | null;
  childSpaces: SpacePreview[];

  // Operations
  updateSpace(
    props: Pick<UpdateSpaceProps, "update">
  ): Promise<SpaceWithPermissions | undefined>;
  deleteSpace: () => Promise<void>;
  joinSpace: () => Promise<void>;
  leaveSpace: () => Promise<void>;

  // State
  loading: boolean;
  error: string | null;
}

// The `code` of a server error response, if there is one.
function errorCode(err: unknown): unknown {
  return (err as { response?: { data?: { code?: unknown } } })?.response?.data?.code;
}

function useSpaceData({
  spaceId,
  shortId,
  slug,
  space: spaceProp,
  include,
}: UseSpaceDataProps): UseSpaceDataValues {
  const [space, setSpace] = useState<SpaceDetailed | undefined | null>(spaceProp);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [breadcrumb, setBreadcrumb] = useState<SpaceBreadcrumbEntry[]>([]);

  // Cache to store fetched spaces keyed by unique identifier
  const spaceCache = useRef<Record<string, SpaceDetailed>>({});
  // The key (`spaceId-shortId-slug`) of a space dropped because the viewer
  // can no longer see it, so the fetch effect doesn't load it again.
  const goneKey = useRef<string | null>(null);

  // Fetch hooks
  const fetchSpace = useFetchSpace();
  const fetchSpaceByShortId = useFetchSpaceByShortId();
  const fetchSpaceBySlug = useFetchSpaceBySlug();
  const fetchSpaceBreadcrumb = useFetchSpaceBreadcrumb();

  // Operation hooks
  const updateSpaceHook = useUpdateSpace();
  const deleteSpaceHook = useDeleteSpace();
  const joinSpaceHook = useJoinSpace();
  const leaveSpaceHook = useLeaveSpace();

  // Stabilize include param to prevent infinite loops when passed as inline array
  const stableInclude = useMemo(
    () => include,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(include)]
  );

  // Compute permissions. The setting defaults only satisfy the props' types;
  // the flags come from the server's `memberPermissions` alone.
  const permissions = useSpacePermissions({
    memberPermissions: space?.memberPermissions,
    postingPermission: space?.postingPermission || "members",
    readingPermission: space?.readingPermission || "anyone",
  });

  // Show a changed space and keep the cache in step, so switching to another
  // space and back shows the change rather than the space as first fetched.
  const applySpace = useCallback((next: SpaceDetailed) => {
    for (const key of Object.keys(spaceCache.current)) {
      if (spaceCache.current[key].id === next.id) spaceCache.current[key] = next;
    }
    setSpace(next);
  }, []);

  // Handle space update
  const handleUpdateSpace = useCallback(
    async ({ update }: Pick<UpdateSpaceProps, "update">) => {
      if (!space) return;
      try {
        const newSpace = await updateSpaceHook({
          spaceId: space.id,
          update,
        });
        // The response is the space with the caller's server permissions, but
        // without `parentSpace` / `childSpaces`: keep those from the current
        // state.
        if (newSpace) applySpace({ ...space, ...newSpace });
        return newSpace;
      } catch (err) {
        handleError(err, "Failed to update space");
        setError("Failed to update space");
      }
    },
    [space, updateSpaceHook, applySpace]
  );

  // Handle space delete
  const handleDeleteSpace = useCallback(async () => {
    if (!space) return;

    try {
      await deleteSpaceHook({ spaceId: space.id });
      setSpace(undefined);
    } catch (err) {
      handleError(err, "Failed to delete space");
      setError("Failed to delete space");
    }
  }, [space, deleteSpaceHook]);

  // Load the space again after a membership change, the way the hook loads it
  // by id: the server's `memberPermissions` (never guessed from the
  // membership), the member count and the hierarchy, all as they are now.
  const refreshSpace = useCallback(
    async (id: string) => {
      try {
        const fresh = await fetchSpace({ spaceId: id, include: stableInclude });
        applySpace(fresh);
      } catch (err) {
        // A space the viewer can no longer see (a private space just left)
        // answers exactly like one that doesn't exist: drop it.
        if (errorCode(err) === "space/not-found") {
          for (const key of Object.keys(spaceCache.current)) {
            if (spaceCache.current[key].id === id) delete spaceCache.current[key];
          }
          goneKey.current = `${spaceId ?? ""}-${shortId ?? ""}-${slug ?? ""}`;
          setSpace(null);
          return;
        }
        handleError(err, "Failed to refresh space");
        setError("Failed to refresh space");
      }
    },
    [fetchSpace, stableInclude, applySpace, spaceId, shortId, slug]
  );

  // Handle join space
  const handleJoinSpace = useCallback(async () => {
    if (!space) return;

    setError(null);
    try {
      await joinSpaceHook({ spaceId: space.id });
    } catch (err) {
      // Already a member (an earlier join landed but its reload failed):
      // load the space so the flags catch up.
      if (errorCode(err) === "space/already-member") {
        await refreshSpace(space.id);
        return;
      }
      handleError(err, "Failed to join space");
      setError("Failed to join space");
      return;
    }
    await refreshSpace(space.id);
  }, [space, joinSpaceHook, refreshSpace]);

  // Handle leave space
  const handleLeaveSpace = useCallback(async () => {
    if (!space) return;

    setError(null);
    try {
      await leaveSpaceHook({ spaceId: space.id });
    } catch (err) {
      // Shown as an active member but no longer one (an earlier leave landed
      // but its reload failed): load the space so the flags catch up. A
      // pending, banned or rejected member gets the same code as a real
      // refusal, so it stays an error.
      if (
        errorCode(err) === "space/membership-required" &&
        space.memberPermissions?.status === "active"
      ) {
        await refreshSpace(space.id);
        return;
      }
      handleError(err, "Failed to leave space");
      setError("Failed to leave space");
      return;
    }
    await refreshSpace(space.id);
  }, [space, leaveSpaceHook, refreshSpace]);

  // Fetch space effect
  useEffect(() => {
    const handleFetchSpace = async () => {
      if (!spaceId && !shortId && !slug) return;

      // If space is already loaded with matching ID, skip fetch
      if (space && spaceId && space.id === spaceId) return;
      if (space && shortId && space.shortId === shortId) return;
      if (space && slug && space.slug === slug) return;

      const uniqueKey = `${spaceId ?? ""}-${shortId ?? ""}-${slug ?? ""}`;

      // A space dropped after the viewer lost access stays dropped until the
      // hook is pointed at another space.
      if (goneKey.current === uniqueKey) return;
      goneKey.current = null;

      // If we have a cached space, update the state and exit
      if (spaceCache.current[uniqueKey]) {
        setSpace(spaceCache.current[uniqueKey]);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        let fetchedSpace: SpaceDetailed | null = null;

        if (spaceId) {
          fetchedSpace = await fetchSpace({ spaceId, include: stableInclude });
        } else if (shortId) {
          fetchedSpace = await fetchSpaceByShortId({ shortId, include: stableInclude });
        } else if (slug) {
          fetchedSpace = await fetchSpaceBySlug({ slug, include: stableInclude });
        }

        if (fetchedSpace) {
          // Store the fetched space in cache
          spaceCache.current[uniqueKey] = fetchedSpace;
          setSpace(fetchedSpace);
        } else {
          setSpace(null);
        }
      } catch (err) {
        handleError(err, "Failed to fetch space");
        setError("Failed to fetch space");
        setSpace(null);
      } finally {
        setLoading(false);
      }
    };

    handleFetchSpace();
  }, [
    fetchSpace,
    fetchSpaceByShortId,
    fetchSpaceBySlug,
    spaceId,
    shortId,
    slug,
    space,
    stableInclude,
  ]);

  // Fetch breadcrumb effect
  useEffect(() => {
    const handleFetchBreadcrumb = async () => {
      if (!space?.id) {
        setBreadcrumb([]);
        return;
      }

      try {
        const breadcrumbEntries = await fetchSpaceBreadcrumb({
          spaceId: space.id,
        });
        setBreadcrumb(breadcrumbEntries);
      } catch (err) {
        // Breadcrumb is not critical, just log the error
        handleError(err, "Failed to fetch space breadcrumb");
        setBreadcrumb([]);
      }
    };

    handleFetchBreadcrumb();
  }, [space?.id, fetchSpaceBreadcrumb]);

  // Update space when prop changes
  // Stable while its content is the same, so an object created again on every
  // render (an inline `space={{ ... }}`) isn't a change.
  const stableSpaceProp = useStableObject(spaceProp);
  useEffect(() => {
    if (stableSpaceProp) setSpace(stableSpaceProp);
  }, [stableSpaceProp]);

  return {
    space,
    setSpace,

    // Permissions
    isMember: permissions.isMember,
    isAdmin: permissions.isAdmin,
    isModerator: permissions.isModerator,
    canPost: permissions.canPost,
    canModerate: permissions.canModerate,
    canRead: permissions.canRead,
    membershipStatus: space?.memberPermissions?.status || null,
    isPending: permissions.isPending,
    isBanned: permissions.isBanned,

    // Hierarchy
    breadcrumb,
    parentSpace: space?.parentSpace || null,
    childSpaces: space?.childSpaces || [],

    // Operations
    updateSpace: handleUpdateSpace,
    deleteSpace: handleDeleteSpace,
    joinSpace: handleJoinSpace,
    leaveSpace: handleLeaveSpace,

    // State
    loading,
    error,
  };
}

export default useSpaceData;

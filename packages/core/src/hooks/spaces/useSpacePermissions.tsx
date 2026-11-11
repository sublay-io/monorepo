import { useMemo } from "react";
import {
  SpaceMemberPermissions,
  PostingPermission,
  ReadingPermission,
} from "../../interfaces/models/Space";

export interface UseSpacePermissionsProps {
  /** The space's `memberPermissions` from the server. Missing = every flag false. */
  memberPermissions: SpaceMemberPermissions | null | undefined;
  // The space's settings. They never stand in for `memberPermissions`: the
  // flags come only from the server's calculation.
  postingPermission: PostingPermission;
  readingPermission?: ReadingPermission;
}

export interface UseSpacePermissionsValues {
  isMember: boolean;
  isAdmin: boolean;
  isModerator: boolean;
  canPost: boolean;
  canModerate: boolean;
  canRead: boolean;
  isPending: boolean;
  isBanned: boolean;
}

function useSpacePermissions({
  memberPermissions,
}: UseSpacePermissionsProps): UseSpacePermissionsValues {
  return useMemo(() => {
    // Use server-computed permission booleans directly so the server stays the
    // single source of truth and client/server logic can't drift. Without
    // them (e.g. a space not loaded yet), nothing is allowed: the client never
    // guesses from the space's settings.
    return {
      isMember: memberPermissions?.isMember ?? false,
      isAdmin: memberPermissions?.isAdmin ?? false,
      isModerator: memberPermissions?.isModerator ?? false,
      canPost: memberPermissions?.canPost ?? false,
      canModerate: memberPermissions?.canModerate ?? false,
      canRead: memberPermissions?.canRead ?? false,
      isPending: memberPermissions?.status === "pending",
      isBanned: memberPermissions?.status === "banned",
    };
  }, [memberPermissions]);
}

export default useSpacePermissions;

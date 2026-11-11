import { describe, it, expect } from "vitest";
import { renderHook } from "@testing-library/react";

import useSpacePermissions from "./useSpacePermissions";
import type { SpaceMemberPermissions } from "../../interfaces/models/Space";

function makePermissions(overrides: Partial<SpaceMemberPermissions> = {}): SpaceMemberPermissions {
  return {
    isAdmin: false,
    isModerator: false,
    isMember: true,
    status: "active",
    canPost: true,
    canModerate: false,
    canRead: true,
    ...overrides,
  };
}

describe("useSpacePermissions", () => {
  it("allows nothing when there are no memberPermissions, whatever the space's settings", () => {
    const allFalse = {
      isMember: false,
      isAdmin: false,
      isModerator: false,
      canPost: false,
      canModerate: false,
      canRead: false,
      isPending: false,
      isBanned: false,
    };

    const { result: nullResult } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: null,
        postingPermission: "anyone",
        readingPermission: "anyone",
      }),
    );
    expect(nullResult.current).toEqual(allFalse);

    const { result: undefinedResult } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: undefined,
        postingPermission: "anyone",
      }),
    );
    expect(undefinedResult.current).toEqual(allFalse);
  });

  it("follows the server for a non-member, not the space's settings", () => {
    // An open space whose server answer still denies posting (e.g. a banned
    // ancestor, or reading inherited from a members-only parent).
    const { result } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: makePermissions({
          isMember: false,
          status: null,
          canPost: false,
          canRead: false,
        }),
        postingPermission: "anyone",
        readingPermission: "anyone",
      }),
    );

    expect(result.current.canPost).toBe(false);
    expect(result.current.canRead).toBe(false);
    expect(result.current.isMember).toBe(false);
  });

  it("passes server-computed booleans through directly when memberPermissions is present", () => {
    const { result } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: makePermissions({ isAdmin: true, isModerator: true, canModerate: true }),
        postingPermission: "team",
      }),
    );

    expect(result.current).toMatchObject({
      isMember: true,
      isAdmin: true,
      isModerator: true,
      canModerate: true,
      isPending: false,
      isBanned: false,
    });
  });

  it("derives isPending/isBanned from the membership status", () => {
    const { result: pendingResult } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: makePermissions({ status: "pending", isMember: false, canPost: false, canRead: false }),
        postingPermission: "members",
      }),
    );
    expect(pendingResult.current.isPending).toBe(true);
    expect(pendingResult.current.isBanned).toBe(false);

    const { result: bannedResult } = renderHook(() =>
      useSpacePermissions({
        memberPermissions: makePermissions({ status: "banned", isMember: false, canPost: false, canRead: false }),
        postingPermission: "members",
      }),
    );
    expect(bannedResult.current.isBanned).toBe(true);
  });
});

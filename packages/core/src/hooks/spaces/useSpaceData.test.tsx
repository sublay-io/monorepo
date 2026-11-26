import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeSpaceDetailed,
  makeMemberPermissions,
} from "../../test-utils";
import useSpaceData from "./useSpaceData";

afterEach(() => {
  resetAxiosMocks();
});

// Any space with a resolved `id` (whether fetched or passed in directly via
// the `space` prop) triggers a breadcrumb GET on mount — so every render
// below needs that response queued via `beforeRender`, even when no main
// space-fetch call is expected.
function mockBreadcrumb(axiosPrivate: { mockResponse: (m: "get", d: unknown) => void }) {
  axiosPrivate.mockResponse("get", { breadcrumb: [], depth: 0 });
}

// What join answers with: the membership record itself.
function membershipRecord(status: "active" | "pending") {
  return {
    id: "membership-1",
    spaceId: "space-1",
    userId: "user-1",
    role: "member",
    status,
    joinedAt: "2024-01-01T00:00:00.000Z",
    createdAt: "2024-01-01T00:00:00.000Z",
  };
}

describe("useSpaceData", () => {
  it("resolves a space by spaceId and fetches its breadcrumb", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ spaceId: "space-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", space); // fetchSpace
          mockBreadcrumb(axiosPrivate); // fetchSpaceBreadcrumb
        },
      },
    );

    await waitFor(() => expect(result.current.space).toEqual(space));
    expect(result.current.loading).toBe(false);

    const [spaceCall, breadcrumbCall] = axiosPrivate.calls("get");
    expect(spaceCall.url).toBe("/test-project/spaces/space-1");
    expect(breadcrumbCall.url).toBe("/test-project/spaces/space-1/breadcrumb");
  });

  it("uses a directly-provided space prop without a main fetch", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );

    expect(result.current.space).toEqual(space);
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));
    expect(axiosPrivate.calls("get")[0].url).toBe(
      "/test-project/spaces/space-1/breadcrumb",
    );
  });

  it("computes permission flags from the resolved space's memberPermissions", async () => {
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: {
        isAdmin: true,
        isModerator: false,
        isMember: true,
        status: "active",
        canPost: true,
        canModerate: true,
        canRead: true,
      },
    });

    const { result } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );

    expect(result.current.isAdmin).toBe(true);
    expect(result.current.canModerate).toBe(true);
    expect(result.current.membershipStatus).toBe("active");
  });

  it("does not throw and leaves space unset when the fetch fails", async () => {
    // The effect re-runs once after the first failure (its deps include
    // `space`, which goes from undefined to null) before settling — so two
    // error responses must be queued, or the second call falls through to
    // the real, un-mocked axios method.
    const { result } = renderHookWithAxios(
      () => useSpaceData({ spaceId: "space-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockError("get", 500, { message: "Internal error" });
          axiosPrivate.mockError("get", 500, { message: "Internal error" });
        },
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.space).toBeNull();
    expect(result.current.error?.status).toBe(500);
  });

  it("joins the space, then loads it again for the server's permissions", async () => {
    const space = makeSpaceDetailed({ id: "space-1", membersCount: 5 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space, include: "files" }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    // An active member who still can't post (e.g. a "team" space): the hook
    // must not guess `canPost` from the membership status.
    const memberPermissions = makeMemberPermissions({
      isMember: true,
      status: "active",
      canPost: false,
    });
    axiosPrivate.mockResponse("post", membershipRecord("active"), 201);
    axiosPrivate.mockResponse("get", { ...space, membersCount: 6, memberPermissions });

    await act(async () => {
      await result.current.joinSpace();
    });

    expect(result.current.space?.membersCount).toBe(6);
    expect(result.current.space?.memberPermissions).toEqual(memberPermissions);
    expect(result.current.isMember).toBe(true);
    expect(result.current.canPost).toBe(false);
    expect(result.current.error).toBeNull();

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/join");
    const refetch = axiosPrivate.calls("get")[1];
    expect(refetch.url).toBe("/test-project/spaces/space-1");
    expect(refetch.config).toEqual({ params: { include: "files" } });
  });

  it("shows a pending join request from the space loaded again", async () => {
    const space = makeSpaceDetailed({ id: "space-1", membersCount: 5 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    const memberPermissions = makeMemberPermissions({ status: "pending", canRead: true });
    axiosPrivate.mockResponse("post", membershipRecord("pending"), 201);
    axiosPrivate.mockResponse("get", { ...space, memberPermissions });

    await act(async () => {
      await result.current.joinSpace();
    });

    // The count is the server's: a pending request isn't a member.
    expect(result.current.space?.membersCount).toBe(5);
    expect(result.current.isMember).toBe(false);
    expect(result.current.isPending).toBe(true);
  });

  it("doesn't load the space again when the join fails", async () => {
    const space = makeSpaceDetailed({ id: "space-1", membersCount: 5 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockError("post", 403, { error: "You are banned from this space.", code: "space/banned" });

    await act(async () => {
      await result.current.joinSpace();
    });

    // The server's message and code, not a generic one.
    expect(result.current.error?.message).toBe("You are banned from this space.");
    expect(result.current.error?.code).toBe("space/banned");
    expect(result.current.error?.status).toBe(403);
    expect(result.current.space).toEqual(space);
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("a repeat join (200 with the existing membership) loads the space again", async () => {
    // Shown as a non-member: an earlier join landed but its reload failed.
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ canRead: true }),
    });
    const fresh = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canRead: true }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockResponse("post", membershipRecord("active"), 200);
    axiosPrivate.mockResponse("get", fresh);

    await act(async () => {
      await result.current.joinSpace();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.space).toEqual(fresh);
    expect(result.current.isMember).toBe(true);
  });

  it("a leave refused because it already happened loads the space again", async () => {
    // Shown as an active member: an earlier leave landed but its reload failed.
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canRead: true }),
    });
    const fresh = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ canRead: true }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockError("delete", 403, { error: "Already done.", code: "space/membership-required" });
    axiosPrivate.mockResponse("get", fresh);

    await act(async () => {
      await result.current.leaveSpace();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.space).toEqual(fresh);
    expect(result.current.isMember).toBe(false);
  });

  it("a pending member's refused leave stays an error and loads nothing", async () => {
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "pending" }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockError("delete", 403, { error: "Space membership required", code: "space/membership-required" });

    await act(async () => {
      await result.current.leaveSpace();
    });

    expect(result.current.error?.message).toBe("Space membership required");
    expect(result.current.error?.code).toBe("space/membership-required");
    expect(result.current.space).toEqual(space);
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("a retry after a failed reload clears the reload error", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });
    const fresh = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canRead: true }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockResponse("post", membershipRecord("active"), 201);
    axiosPrivate.mockError("get", 500, { error: "Internal error" });
    await act(async () => {
      await result.current.joinSpace();
    });
    expect(result.current.error?.message).toBe("Internal error");

    axiosPrivate.mockResponse("post", membershipRecord("active"), 200);
    axiosPrivate.mockResponse("get", fresh);
    await act(async () => {
      await result.current.joinSpace();
    });

    expect(result.current.error).toBeNull();
    expect(result.current.space).toEqual(fresh);
  });

  it("leaves the space, then loads it again for the server's permissions", async () => {
    const space = makeSpaceDetailed({
      id: "space-1",
      membersCount: 5,
      memberPermissions: {
        isAdmin: false,
        isModerator: false,
        isMember: true,
        status: "active",
        canPost: true,
        canModerate: false,
        canRead: true,
      },
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    // Now a non-member of an open space: still reads, no longer posts.
    const memberPermissions = makeMemberPermissions({ canRead: true });
    axiosPrivate.mockResponse("delete", "", 204);
    axiosPrivate.mockResponse("get", { ...space, membersCount: 4, memberPermissions });

    await act(async () => {
      await result.current.leaveSpace();
    });

    expect(result.current.space?.membersCount).toBe(4);
    expect(result.current.space?.memberPermissions).toEqual(memberPermissions);
    expect(result.current.isMember).toBe(false);
    expect(result.current.canRead).toBe(true);
    expect(result.current.canPost).toBe(false);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/spaces/space-1/members/me");
    expect(axiosPrivate.calls("get")[1].url).toBe("/test-project/spaces/space-1");
  });

  it("drops a space the user can no longer see after leaving it", async () => {
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canRead: true }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockResponse("delete", "", 204);
    axiosPrivate.mockError("get", 404, { error: "Space not found.", code: "space/not-found" });

    await act(async () => {
      await result.current.leaveSpace();
    });

    expect(result.current.space).toBeNull();
    expect(result.current.isMember).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it("drops a space loaded by id once the user can no longer see it, without loading it again", async () => {
    const space = makeSpaceDetailed({
      id: "space-1",
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canRead: true }),
    });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ spaceId: "space-1" }),
      {
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", space);
          mockBreadcrumb(axiosPrivate);
        },
      },
    );
    await waitFor(() => expect(result.current.space).toEqual(space));
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));

    axiosPrivate.mockResponse("delete", "", 204);
    axiosPrivate.mockError("get", 404, { error: "Space not found.", code: "space/not-found" });

    await act(async () => {
      await result.current.leaveSpace();
    });

    expect(result.current.space).toBeNull();
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
    // The space fetch, the breadcrumb, and the one reload after leaving.
    expect(axiosPrivate.calls("get")).toHaveLength(3);
  });

  it("keeps the space and reports an error when loading it again fails", async () => {
    const space = makeSpaceDetailed({ id: "space-1", membersCount: 5 });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockResponse("post", membershipRecord("active"), 201);
    axiosPrivate.mockError("get", 500, { error: "Internal error" });

    await act(async () => {
      await result.current.joinSpace();
    });

    expect(result.current.space).toEqual(space);
    expect(result.current.error?.message).toBe("Internal error");
  });

  it("updates the space via updateSpace, keeping the server's permissions and the hierarchy", async () => {
    const parentSpace = { id: "parent-1", shortId: "p1", name: "Parent", slug: null, avatarFileId: null, visibility: "public" as const };
    const space = makeSpaceDetailed({ id: "space-1", name: "Old", parentSpace });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    // The update response: the space plus memberPermissions, without
    // parentSpace / childSpaces.
    const { parentSpace: _p, childSpaces: _c, ...base } = space;
    const memberPermissions = makeMemberPermissions({
      isMember: true,
      isAdmin: true,
      status: "active",
      canPost: true,
      canModerate: true,
    });
    const updated = { ...base, name: "New", memberPermissions };
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current.updateSpace({ update: { name: "New" } });
    });

    expect(returned).toEqual(updated);
    expect(result.current.space?.name).toBe("New");
    expect(result.current.space?.memberPermissions).toEqual(memberPermissions);
    expect(result.current.isAdmin).toBe(true);
    expect(result.current.parentSpace).toEqual(parentSpace);
  });

  it("shows the left space's new permissions after switching to another space and back", async () => {
    const spaceA = makeSpaceDetailed({
      id: "space-a",
      membersCount: 5,
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canPost: true }),
    });
    const spaceB = makeSpaceDetailed({ id: "space-b" });

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: { spaceId: string }) => useSpaceData(props),
      {
        initialProps: { spaceId: "space-a" },
        beforeRender: ({ axiosPrivate }) => {
          axiosPrivate.mockResponse("get", spaceA);
          mockBreadcrumb(axiosPrivate);
        },
      },
    );
    await waitFor(() => expect(result.current.space?.id).toBe("space-a"));
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(2));

    const left = makeMemberPermissions({ canRead: true });
    axiosPrivate.mockResponse("delete", "", 204);
    axiosPrivate.mockResponse("get", { ...spaceA, membersCount: 4, memberPermissions: left });
    await act(async () => {
      await result.current.leaveSpace();
    });
    expect(result.current.isMember).toBe(false);

    axiosPrivate.mockResponse("get", spaceB);
    mockBreadcrumb(axiosPrivate);
    mockBreadcrumb(axiosPrivate);
    rerender({ spaceId: "space-b" });
    await waitFor(() => expect(result.current.space?.id).toBe("space-b"));

    rerender({ spaceId: "space-a" });
    await waitFor(() => expect(result.current.space?.id).toBe("space-a"));

    expect(result.current.isMember).toBe(false);
    expect(result.current.canPost).toBe(false);
    expect(result.current.space?.memberPermissions).toEqual(left);
    expect(result.current.space?.membersCount).toBe(4);
    // Space A came back from the cache: A, A loaded again after leaving, B.
    const spaceFetches = axiosPrivate
      .calls("get")
      .filter((c) => !c.url.endsWith("/breadcrumb"));
    expect(spaceFetches.map((c) => c.url)).toEqual([
      "/test-project/spaces/space-a",
      "/test-project/spaces/space-a",
      "/test-project/spaces/space-b",
    ]);
  });

  it("deletes the space via deleteSpace and clears local state", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useSpaceData({ space }),
      { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );
    await waitFor(() => expect(axiosPrivate.calls("get")).toHaveLength(1));

    axiosPrivate.mockResponse("delete", "", 204);

    await act(async () => {
      await result.current.deleteSpace();
    });

    expect(result.current.space).toBeUndefined();
  });

  // REGRESSION (#233): an inline `space` object is a fresh reference every
  // render. Held raw in the sync effect's deps, any re-render set state, which
  // re-rendered, which set state again: an endless loop. (Mount alone didn't
  // loop: the first sync sets the same object the state started with.)
  it("does not loop when re-rendered with an inline space prop", async () => {
    const base = makeSpaceDetailed({ id: "space-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(() => {
      renders += 1;
      // The old code looped synchronously; fail instead of hanging.
      if (renders > 50) throw new Error("render loop");
      return useSpaceData({ space: { ...base } });
    }, { beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) });

    for (let i = 0; i < 3; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(renders).toBeLessThan(10);
    expect(result.current.space).toEqual(base);
  });

  it("still takes a space prop whose content really changes", async () => {
    const base = makeSpaceDetailed({ id: "space-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(
      (props: { value: string }) => {
        renders += 1;
        if (renders > 50) throw new Error("render loop");
        return useSpaceData({ space: { ...base, name: props.value } });
      },
      { initialProps: { value: "first" }, beforeRender: ({ axiosPrivate }) => mockBreadcrumb(axiosPrivate) },
    );

    rerender({ value: "second" });
    await waitFor(() => expect(result.current.space?.name).toBe("second"));
  });
});

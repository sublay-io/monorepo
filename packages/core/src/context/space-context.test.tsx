import React, { useContext } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, renderHook, act, waitFor } from "@testing-library/react";

import { resetAxiosMocks, makeSpaceDetailed, makeMemberPermissions } from "../test-utils";
import { makeProvidersWrapper } from "./testHelpers";
import { SpaceProvider, SpaceContext } from "./space-context";

afterEach(() => {
  resetAxiosMocks();
});

function emptyBreadcrumb() {
  return { breadcrumb: [] };
}

describe("SpaceProvider", () => {
  it("exposes a directly-provided space and its permissions via context", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyBreadcrumb()),
    });

    const { result } = renderHook(() => useContext(SpaceContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <SpaceProvider space={space}>{children}</SpaceProvider>
        </Wrapper>
      ),
    });

    expect(result.current.space).toEqual(space);
    expect(result.current.isMember).toBe(false);
    expect(result.current.canPost).toBe(false);
    expect(result.current.canRead).toBe(true);

    await waitFor(() => expect(result.current.breadcrumb).toEqual([]));
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/breadcrumb");
  });

  it("fetches the space by spaceId and exposes the resolved space via context", async () => {
    const space = makeSpaceDetailed({ id: "space-1" });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => {
        axiosPrivate.mockResponse("get", space);
        axiosPrivate.mockResponse("get", emptyBreadcrumb());
      },
    });

    const { result } = renderHook(() => useContext(SpaceContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <SpaceProvider spaceId="space-1">{children}</SpaceProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.space).toEqual(space));

    const calls = axiosPrivate.calls("get");
    expect(calls[0].url).toBe("/test-project/spaces/space-1");
    expect(calls[1].url).toBe("/test-project/spaces/space-1/breadcrumb");
  });

  it("renders nothing when no space-identifying prop is provided", () => {
    const { Wrapper } = makeProvidersWrapper();

    const NoIdentifyingPropsSpaceProvider = SpaceProvider as React.FC<{
      children: React.ReactNode;
    }>;
    const { container } = render(
      <Wrapper>
        <NoIdentifyingPropsSpaceProvider>
          <div data-testid="child" />
        </NoIdentifyingPropsSpaceProvider>
      </Wrapper>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeNull();
  });

  it("updates membership permissions when joinSpace is called", async () => {
    const space = makeSpaceDetailed({ id: "space-1", membersCount: 1 });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyBreadcrumb()),
    });

    const { result } = renderHook(() => useContext(SpaceContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <SpaceProvider space={space}>{children}</SpaceProvider>
        </Wrapper>
      ),
    });

    axiosPrivate.mockResponse("post", {
      message: "Joined",
      membership: {
        id: "member-1",
        spaceId: "space-1",
        userId: "user-1",
        role: "member",
        status: "active",
        joinedAt: "2024-01-01T00:00:00.000Z",
      },
      memberPermissions: makeMemberPermissions({ isMember: true, status: "active", canPost: true }),
    });

    await act(async () => {
      await result.current.joinSpace!();
    });

    expect(result.current.space?.membersCount).toBe(2);
    expect(result.current.space?.memberPermissions).toMatchObject({
      isMember: true,
      status: "active",
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/join");
  });
});

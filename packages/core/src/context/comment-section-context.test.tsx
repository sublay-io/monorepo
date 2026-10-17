import { useContext } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { renderHook, act, waitFor } from "@testing-library/react";

import { resetAxiosMocks, makeEntity, makeAuthUser, makeComment } from "../test-utils";
import { makeProvidersWrapper } from "./testHelpers";
import { CommentSectionProvider, CommentSectionContext } from "./comment-section-context";

afterEach(() => {
  resetAxiosMocks();
});

function emptyCommentsPage() {
  return {
    data: [],
    pagination: { page: 1, pageSize: 15, totalPages: 1, totalItems: 0, hasMore: false },
  };
}

describe("CommentSectionProvider", () => {
  it("exposes the entity and its loaded root comments via context", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const comment = makeComment({ entityId: "entity-1" });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockResponse("get", {
          data: [comment],
          pagination: { page: 1, pageSize: 15, totalPages: 1, totalItems: 1, hasMore: false },
        }),
    });

    const { result } = renderHook(() => useContext(CommentSectionContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <CommentSectionProvider entity={entity}>{children}</CommentSectionProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.comments).toEqual([comment]));
    expect(result.current.entity).toEqual(entity);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/comments");
    expect(call.config?.params).toMatchObject({ entityId: "entity-1" });
  });

  it("supports a state-changing action (setSortBy) exposed via context", async () => {
    const entity = makeEntity({ id: "entity-1" });

    const { Wrapper } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyCommentsPage()),
    });

    const { result } = renderHook(() => useContext(CommentSectionContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <CommentSectionProvider entity={entity}>{children}</CommentSectionProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.sortBy).toBe("top");

    act(() => {
      result.current.setSortBy!("createdAt");
    });

    expect(result.current.sortBy).toBe("createdAt");
  });

  it("creates a comment via the exposed createComment action", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const user = makeAuthUser({ id: "user-1", username: "alice" });

    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      user,
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", emptyCommentsPage()),
    });

    const { result } = renderHook(() => useContext(CommentSectionContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <CommentSectionProvider entity={entity}>{children}</CommentSectionProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));

    const serverComment = makeComment({ id: "comment-1", content: "Hello there" });
    axiosPrivate.mockResponse("post", serverComment, 201);

    await act(async () => {
      await result.current.createComment!({ content: "Hello there" });
    });

    expect(result.current.newComments).toEqual([serverComment]);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/comments");
    expect(call.body).toMatchObject({ entityId: "entity-1", content: "Hello there" });
  });
});

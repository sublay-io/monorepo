import { describe, it, expect, afterEach, vi } from "vitest";
import { waitFor } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  okAxiosResponse,
  axiosErrorWithStatus,
} from "../../test-utils";
import { axiosPrivate } from "../../config/axios";
import useCommentSectionData from "./useCommentSectionData";
import { makeComment, makeEntity } from "./testHelpers";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => resetAxiosMocks());

const X = "44444444-4444-4444-8444-444444444444";

const page = (data: Comment[]) => ({
  data,
  pagination: { nextCursor: null, hasMore: false },
});

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (err: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe("useCommentSectionData — highlightedCommentLoading", () => {
  it("is false when there's no highlightedCommentId", async () => {
    const entity = makeEntity({ id: "entity-1" });
    vi.spyOn(axiosPrivate, "get").mockImplementation(() =>
      Promise.resolve(okAxiosResponse(page([]), 200) as any),
    );
    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ entity }),
    );
    expect(result.current.highlightedCommentLoading).toBe(false);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedCommentLoading).toBe(false);
  });

  it("is true while the highlight is fetched, and false once it's found", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const target = makeComment({ id: X, entityId: "entity-1" });
    const highlight = deferred<any>();
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) =>
      url.endsWith(`/comments/${X}`)
        ? highlight.promise
        : Promise.resolve(okAxiosResponse(page([]), 200) as any),
    );

    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ entity, highlightedCommentId: X }),
    );
    expect(result.current.highlightedCommentLoading).toBe(true);
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.highlightedCommentLoading).toBe(true);
    expect(result.current.highlightedComment).toBeNull();

    highlight.resolve(okAxiosResponse(target, 200));
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );
    expect(result.current.highlightedComment?.comment.id).toBe(X);
  });

  it("is false after the highlight isn't found", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const highlight = deferred<any>();
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) =>
      url.endsWith(`/comments/${X}`)
        ? highlight.promise
        : Promise.resolve(okAxiosResponse(page([]), 200) as any),
    );

    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ entity, highlightedCommentId: X }),
    );
    expect(result.current.highlightedCommentLoading).toBe(true);

    highlight.reject(axiosErrorWithStatus(404, { code: "comment/not-found" }));
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );
    expect(result.current.highlightedComment).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it("is false when the highlighted comment is on another entity", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const other = makeComment({ id: X, entityId: "entity-2" });
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) =>
      Promise.resolve(
        okAxiosResponse(url.endsWith(`/comments/${X}`) ? other : page([]), 200) as any,
      ),
    );

    const { result } = renderHookWithAxios(() =>
      useCommentSectionData({ entity, highlightedCommentId: X }),
    );
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );
    expect(result.current.highlightedComment).toBeNull();
  });

  it("goes back to true on an entity switch until the new fetch settles", async () => {
    const xOnA = makeComment({ id: X, entityId: "entity-A" });
    const xOnB = makeComment({ id: X, entityId: "entity-B" });
    let secondFetch: ReturnType<typeof deferred<any>> | null = null;
    let highlightFetches = 0;
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${X}`)) {
        highlightFetches += 1;
        if (highlightFetches === 1) {
          return Promise.resolve(okAxiosResponse(xOnA, 200) as any);
        }
        secondFetch = deferred<any>();
        return secondFetch.promise;
      }
      if (url.endsWith("/entities/entity-A"))
        return Promise.resolve(okAxiosResponse(makeEntity({ id: "entity-A" }), 200) as any);
      if (url.endsWith("/entities/entity-B"))
        return Promise.resolve(okAxiosResponse(makeEntity({ id: "entity-B" }), 200) as any);
      return Promise.resolve(okAxiosResponse(page([]), 200) as any);
    });

    const { result, rerender } = renderHookWithAxios(
      (p: { entityId: string }) =>
        useCommentSectionData({ entityId: p.entityId, highlightedCommentId: X }),
      { initialProps: { entityId: "entity-A" } } as any,
    );
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-A"));
    await waitFor(() =>
      expect(result.current.highlightedComment?.comment.id).toBe(X),
    );
    expect(result.current.highlightedCommentLoading).toBe(false);

    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-B"));
    await waitFor(() => expect(highlightFetches).toBe(2));
    expect(result.current.highlightedCommentLoading).toBe(true);
    expect(result.current.highlightedComment).toBeNull();

    secondFetch!.resolve(okAxiosResponse(xOnB, 200));
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );
    expect(result.current.highlightedComment?.comment.entityId).toBe("entity-B");
  });

  it("is false again when highlightedCommentId is cleared mid-fetch", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const highlight = deferred<any>();
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) =>
      url.endsWith(`/comments/${X}`)
        ? highlight.promise
        : Promise.resolve(okAxiosResponse(page([]), 200) as any),
    );

    const { result, rerender } = renderHookWithAxios(
      (p: { h: string | null }) =>
        useCommentSectionData({ entity, highlightedCommentId: p.h }),
      { initialProps: { h: X } } as any,
    );
    expect(result.current.highlightedCommentLoading).toBe(true);
    rerender({ h: null });
    expect(result.current.highlightedCommentLoading).toBe(false);
    highlight.resolve(okAxiosResponse(makeComment({ id: X, entityId: "entity-1" }), 200));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.highlightedCommentLoading).toBe(false);
    expect(result.current.highlightedComment).toBeNull();
  });
  it("ignores a stale fetch: X → null → X stays loading until the second fetch settles", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const fetches: ReturnType<typeof deferred<any>>[] = [];
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${X}`)) {
        const d = deferred<any>();
        fetches.push(d);
        return d.promise;
      }
      return Promise.resolve(okAxiosResponse(page([]), 200) as any);
    });

    const { result, rerender } = renderHookWithAxios(
      (p: { h: string | null }) =>
        useCommentSectionData({ entity, highlightedCommentId: p.h }),
      { initialProps: { h: X } } as any,
    );
    await waitFor(() => expect(fetches).toHaveLength(1));
    rerender({ h: null });
    rerender({ h: X });
    await waitFor(() => expect(fetches).toHaveLength(2));
    expect(result.current.highlightedCommentLoading).toBe(true);

    // The first (stale) fetch settling doesn't end the current one's loading.
    fetches[0].resolve(
      okAxiosResponse(makeComment({ id: X, entityId: "entity-1", content: "stale" }), 200),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.highlightedCommentLoading).toBe(true);
    expect(result.current.highlightedComment).toBeNull();

    fetches[1].resolve(
      okAxiosResponse(makeComment({ id: X, entityId: "entity-1", content: "fresh" }), 200),
    );
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );
    expect(result.current.highlightedComment?.comment.content).toBe("fresh");
  });
  it("ignores a stale fetch that settles after the current one: loading stays false", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const fetches: ReturnType<typeof deferred<any>>[] = [];
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith(`/comments/${X}`)) {
        const d = deferred<any>();
        fetches.push(d);
        return d.promise;
      }
      return Promise.resolve(okAxiosResponse(page([]), 200) as any);
    });

    const { result, rerender } = renderHookWithAxios(
      (p: { h: string | null }) =>
        useCommentSectionData({ entity, highlightedCommentId: p.h }),
      { initialProps: { h: X } } as any,
    );
    await waitFor(() => expect(fetches).toHaveLength(1));
    rerender({ h: null });
    rerender({ h: X });
    await waitFor(() => expect(fetches).toHaveLength(2));

    fetches[1].resolve(
      okAxiosResponse(makeComment({ id: X, entityId: "entity-1", content: "fresh" }), 200),
    );
    await waitFor(() =>
      expect(result.current.highlightedCommentLoading).toBe(false),
    );

    // The stale fetch settling late must not put the section back into loading.
    fetches[0].reject(axiosErrorWithStatus(500));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.highlightedCommentLoading).toBe(false);
    expect(result.current.highlightedComment?.comment.content).toBe("fresh");
  });
});

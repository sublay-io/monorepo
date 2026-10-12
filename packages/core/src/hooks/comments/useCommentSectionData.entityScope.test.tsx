import React, { useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import {
  resetAxiosMocks,
  makeAuthUser,
  makeSublayStore,
  axiosErrorWithStatus,
} from "../../test-utils";
import { setInitialized, setTokens, setUser } from "../../store/slices/authSlice";
import { SublayContext, type SublayContextValues } from "../../context/sublay-context";
import { EntityContext } from "../../context/entity-context";
import { axiosPrivate } from "../../config/axios";
import useCommentSectionData, {
  type UseCommentSectionDataProps,
} from "./useCommentSectionData";
import useEntity from "../entities/useEntity";
import { makeComment, makeEntity } from "./testHelpers";
import type { Comment } from "../../interfaces/models/Comment";
import type { Entity } from "../../interfaces/models/Entity";
import type { CursorPaginatedResponse } from "../../interfaces/PaginatedResponse";

afterEach(() => {
  resetAxiosMocks();
  vi.restoreAllMocks();
});

const A1 = "11111111-1111-4111-8111-111111111111";
const A2 = "11111111-1111-4111-8111-222222222222";
const B1 = "22222222-2222-4222-8222-222222222222";
const NEW = "33333333-3333-4333-8333-333333333333";

const ok = (data: unknown, status = 200) =>
  Promise.resolve({ data, status, statusText: "OK", headers: {}, config: {} } as any);
const page = (
  data: Comment[],
  nextCursor: string | null = null,
): CursorPaginatedResponse<Comment> => ({
  data,
  pagination: { nextCursor, hasMore: nextCursor !== null },
});
const deferred = <T = unknown,>() => {
  let resolve!: (v: T) => void;
  let reject!: (e: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
};
const tick = (ms = 20) => new Promise((r) => setTimeout(r, ms));

type Route<T> = T | (() => Promise<unknown>);

/**
 * A GET router read at call time: `entities[id]` answers
 * `/entities/:id`, `lists[entityId]` answers the comment list. A function
 * value is called and its promise returned as-is (deferred / rejecting).
 */
function mockApi() {
  const entities: Record<string, Route<Entity>> = {};
  const lists: Record<string, Route<CursorPaginatedResponse<Comment>>> = {};
  const get = vi.spyOn(axiosPrivate, "get").mockImplementation(((url: string, config?: any) => {
    const entityMatch = /\/entities\/([^/]+)$/.exec(url);
    if (entityMatch) {
      const route = entities[entityMatch[1]];
      if (typeof route === "function") return route();
      if (route) return ok(route);
      return Promise.reject(axiosErrorWithStatus(404, { code: "entity/not-found" }));
    }
    if (url.endsWith("/comments")) {
      const route = lists[config?.params?.entityId];
      if (typeof route === "function") return route();
      return ok(route ?? page([]));
    }
    return ok(page([]));
  }) as any);
  const listCalls = () =>
    get.mock.calls
      .filter((c) => String(c[0]).endsWith("/comments"))
      .map((c) => (c[1] as any)?.params ?? {});
  const entityCalls = () =>
    get.mock.calls.map((c) => String(c[0])).filter((u) => /\/entities\//.test(u));
  return { entities, lists, get, listCalls, entityCalls };
}

interface RenderLog {
  entityId: string | undefined;
  commentIds: string[];
  loading: boolean;
}

/**
 * Renders the section hook with changeable props, optionally inside an
 * `EntityContext` whose entity the test can replace. Every render is logged.
 */
function renderSection(options: {
  props: UseCommentSectionDataProps;
  /** Mounts an EntityContext holding this entity (pass `null` for an empty one). */
  contextEntity?: Entity | null;
  signedIn?: boolean;
}) {
  const { props, contextEntity, signedIn = true } = options;
  const store = makeSublayStore();
  store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
  store.dispatch(setUser(signedIn ? makeAuthUser({ id: "user-1", username: "alice" }) : null));
  store.dispatch(setInitialized(true));

  function Wrapper({ children }: { children: React.ReactNode }) {
    const [current, setCurrent] = useState<Entity | null | undefined>(contextEntity);
    const inner =
      contextEntity !== undefined ? (
        <EntityContext.Provider value={{ entity: current, setEntity: setCurrent }}>
          {children}
        </EntityContext.Provider>
      ) : (
        children
      );
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          {inner}
        </SublayContext.Provider>
      </Provider>
    );
  }

  const renders: RenderLog[] = [];
  const rendered = renderHook(
    (p: UseCommentSectionDataProps) => {
      const section = useCommentSectionData(p);
      const context = useEntity();
      renders.push({
        entityId: section.entity?.id,
        commentIds: [...section.comments, ...section.newComments].map((c) => c.id),
        loading: section.loading,
      });
      return { section, contextEntity: context.entity, setContextEntity: context.setEntity };
    },
    { wrapper: Wrapper, initialProps: props },
  );
  return { ...rendered, renders };
}

const quiet = () => vi.spyOn(console, "error").mockImplementation(() => {});

describe("C1 — a create that settles after the section moved to another entity", () => {
  it("success: the comment is returned but not stored under the new entity, whose count is untouched", async () => {
    const api = mockApi();
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);
    const pendingPost = deferred();
    const post = vi.spyOn(axiosPrivate, "post").mockImplementation((() => pendingPost.promise) as any);

    const entityA = makeEntity({ id: "entity-A", commentsCount: 5 });
    const entityB = makeEntity({ id: "entity-B", commentsCount: 100 });
    const { result } = renderSection({ props: {}, contextEntity: entityA });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    let created!: Promise<Comment | undefined>;
    act(() => {
      created = result.current.section.createComment({ content: "hello from A" });
    });
    expect(result.current.contextEntity?.commentsCount).toBe(6);
    expect((post.mock.calls[0][1] as any).entityId).toBe("entity-A");

    // The page moves on to entity B while the POST is in flight.
    act(() => result.current.setContextEntity!(entityB));
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));

    let returned: Comment | undefined;
    await act(async () => {
      pendingPost.resolve({
        data: makeComment({ id: NEW, entityId: "entity-A", content: "hello from A" }),
        status: 201,
      });
      returned = await created;
      await tick();
    });

    expect(returned?.id).toBe(NEW);
    expect(result.current.section.entity?.id).toBe("entity-B");
    expect(result.current.section.newComments).toEqual([]);
    expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]);
    expect(result.current.section.getComment(NEW)).toBeUndefined();
    expect(result.current.contextEntity?.commentsCount).toBe(100);
    expect(result.current.section.entity?.commentsCount).toBe(100);
    expect(result.current.section.submittingComment).toBe(false);
  });

  it("failure: no createError, no reply target and no placeholder land in the new entity; the callback still fires", async () => {
    quiet();
    const api = mockApi();
    const parent = makeComment({
      id: A1,
      entityId: "entity-A",
      repliesCount: 1,
      user: makeAuthUser({ id: "user-3", username: "carol" }) as any,
    });
    api.lists["entity-A"] = page([parent]);
    // B happens to show a comment with the same id (a shared/cached row).
    api.lists["entity-B"] = page([makeComment({ id: A1, entityId: "entity-B", content: "B's" })]);
    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementation((() => pendingPost.promise) as any);
    const failed = vi.fn();

    const entityA = makeEntity({ id: "entity-A", commentsCount: 5 });
    const entityB = makeEntity({ id: "entity-B", commentsCount: 100 });
    const { result } = renderSection({
      props: { callbacks: { commentCreateFailedCallback: failed } },
      contextEntity: entityA,
    });
    await waitFor(() => expect(result.current.section.comments).toHaveLength(1));

    act(() => result.current.section.handleDeepReply(parent));
    let created!: Promise<Comment | undefined>;
    act(() => {
      created = result.current.section.createComment({ content: "a reply" });
    });

    act(() => result.current.setContextEntity!(entityB));
    await waitFor(() => expect(result.current.section.getComment(A1)?.content).toBe("B's"));

    pendingPost.reject(axiosErrorWithStatus(403, { code: "comment/parent-deleted" }));
    await expect(created).resolves.toBeUndefined();
    await waitFor(() => expect(result.current.section.submittingComment).toBe(false));
    await tick();

    expect(failed).toHaveBeenCalledWith(
      expect.objectContaining({ code: "comment/parent-deleted", parentId: A1 }),
    );
    expect(result.current.section.createError).toBeNull();
    expect(result.current.section.repliedToComment).toBeNull();
    expect(result.current.section.showReplyBanner).toBe(false);
    // B's comment wasn't turned into a deleted placeholder.
    expect(result.current.section.getComment(A1)?.content).toBe("B's");
    expect(result.current.section.getComment(A1)?.userDeletedAt ?? null).toBeNull();
    expect(result.current.contextEntity?.commentsCount).toBe(100);
  });
});

describe("C2 — reply/selection state belongs to the entity", () => {
  it("an entity switch clears the reply target, banner, mention, selection and createError", async () => {
    quiet();
    const api = mockApi();
    const parent = makeComment({
      id: A1,
      entityId: "entity-A",
      user: makeAuthUser({ id: "user-3", username: "carol" }) as any,
    });
    const child = makeComment({
      id: A2,
      entityId: "entity-A",
      parentId: A1,
      user: makeAuthUser({ id: "user-4", username: "dave" }) as any,
    });
    api.lists["entity-A"] = page([parent]);
    const post = vi
      .spyOn(axiosPrivate, "post")
      .mockImplementationOnce(() => Promise.reject(axiosErrorWithStatus(500, {})))
      .mockImplementation(((_url: string, body: any) =>
        ok(makeComment({ id: NEW, entityId: body.entityId, parentId: body.parentId ?? null }), 201)) as any);

    const entityA = makeEntity({ id: "entity-A" });
    const entityB = makeEntity({ id: "entity-B" });
    const { result, rerender } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    act(() => result.current.section.handleDeepReply(parent));
    const first = await result.current.section.createComment({ content: "a reply" });
    expect(first).toBeUndefined();
    await waitFor(() => expect(result.current.section.createError).not.toBeNull());
    await waitFor(() => expect(result.current.section.repliedToComment?.id).toBe(A1));
    expect(result.current.section.showReplyBanner).toBe(true);
    act(() => result.current.section.setSelectedComment(parent));
    expect(result.current.section.selectedComment?.id).toBe(A1);

    rerender({ entity: entityB });
    expect(result.current.section.entity?.id).toBe("entity-B");
    expect(result.current.section.repliedToComment).toBeNull();
    expect(result.current.section.showReplyBanner).toBe(false);
    expect(result.current.section.selectedComment).toBeNull();
    expect(result.current.section.createError).toBeNull();
    expect(result.current.section.pushMention).toBeNull();
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    await act(async () => {
      await result.current.section.createComment({ content: "on B now" });
    });
    const body = post.mock.calls[1][1] as any;
    expect(body.entityId).toBe("entity-B");
    expect(body.parentId ?? null).toBeNull();

    // A pushed mention is cleared too.
    rerender({ entity: entityA });
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    act(() => result.current.section.handleShallowReply(child));
    expect(result.current.section.pushMention?.id).toBe("user-4");
    expect(result.current.section.repliedToComment?.id).toBe(A1);
    rerender({ entity: entityB });
    expect(result.current.section.pushMention).toBeNull();
    expect(result.current.section.repliedToComment).toBeNull();
  });

  it("a new object for the same entity keeps them", async () => {
    const api = mockApi();
    const parent = makeComment({
      id: A1,
      entityId: "entity-A",
      user: makeAuthUser({ id: "user-3", username: "carol" }) as any,
    });
    api.lists["entity-A"] = page([parent]);
    const entityA = makeEntity({ id: "entity-A", commentsCount: 1 });
    const { result, rerender } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    act(() => result.current.section.handleDeepReply(parent));
    act(() => result.current.section.setSelectedComment(parent));
    rerender({ entity: { ...entityA, commentsCount: 2 } });
    expect(result.current.section.repliedToComment?.id).toBe(A1);
    expect(result.current.section.showReplyBanner).toBe(true);
    expect(result.current.section.selectedComment?.id).toBe(A1);
  });
});

describe("C3 — the optimistic commentsCount goes to the section's own entity", () => {
  const postOnce = (outcome: "ok" | "fail") =>
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() =>
      outcome === "ok"
        ? ok(makeComment({ id: NEW }), 201)
        : Promise.reject(axiosErrorWithStatus(500, {}))) as any);

  it("(i) an entity the section fetched itself (no provider): its own copy is updated and rolled back", async () => {
    quiet();
    const api = mockApi();
    api.entities["entity-A"] = makeEntity({ id: "entity-A", commentsCount: 5 });
    const { result } = renderSection({ props: { entityId: "entity-A" } });
    await waitFor(() => expect(result.current.section.entity?.id).toBe("entity-A"));
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() => pendingPost.promise) as any);
    let created!: Promise<unknown>;
    act(() => {
      created = result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);
    await act(async () => {
      pendingPost.resolve({ data: makeComment({ id: NEW, entityId: "entity-A" }), status: 201 });
      await created;
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);

    postOnce("fail");
    await result.current.section.createComment({ content: "again" });
    await waitFor(() => expect(result.current.section.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(6));
    // Fetched once; counting never re-requested it or the list.
    expect(api.entityCalls()).toHaveLength(1);
    expect(api.listCalls()).toHaveLength(1);
  });

  it("(ii) the EntityProvider's entity, when it is the section's entity: the context is updated", async () => {
    quiet();
    mockApi();
    const { result } = renderSection({
      props: { entityId: "entity-A" },
      contextEntity: makeEntity({ id: "entity-A", commentsCount: 5 }),
    });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    postOnce("ok");
    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.contextEntity?.commentsCount).toBe(6);
    expect(result.current.section.entity?.commentsCount).toBe(6);

    postOnce("fail");
    await result.current.section.createComment({ content: "again" });
    await waitFor(() => expect(result.current.section.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.contextEntity?.commentsCount).toBe(6));
  });

  it("(ii) the EntityProvider's entity passed on as the `entity` prop: the context is updated, and rolled back on failure", async () => {
    quiet();
    mockApi();
    const store = makeSublayStore();
    store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
    store.dispatch(setUser(makeAuthUser({ id: "user-1", username: "alice" })));
    store.dispatch(setInitialized(true));
    function Wrapper({ children }: { children: React.ReactNode }) {
      const [current, setCurrent] = useState<Entity | null | undefined>(
        makeEntity({ id: "entity-A", commentsCount: 5 }),
      );
      return (
        <Provider store={store}>
          <SublayContext.Provider
            value={{ projectId: "test-project", project: null } as SublayContextValues}
          >
            <EntityContext.Provider value={{ entity: current, setEntity: setCurrent }}>
              {children}
            </EntityContext.Provider>
          </SublayContext.Provider>
        </Provider>
      );
    }
    const { result } = renderHook(
      () => {
        const { entity: fromContext } = useEntity();
        return { section: useCommentSectionData({ entity: fromContext }), fromContext };
      },
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() => pendingPost.promise) as any);
    let created!: Promise<unknown>;
    act(() => {
      created = result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.fromContext?.commentsCount).toBe(6);
    expect(result.current.section.entity?.commentsCount).toBe(6);
    pendingPost.reject(axiosErrorWithStatus(500, {}));
    await created;
    await waitFor(() => expect(result.current.fromContext?.commentsCount).toBe(5));
    await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(5));

    postOnce("ok");
    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.fromContext?.commentsCount).toBe(6);
    expect(result.current.section.entity).toBe(result.current.fromContext);
  });

  it("(iii) an EntityProvider entity that is NOT the section's entity is never touched", async () => {
    quiet();
    const api = mockApi();
    api.entities["entity-Y"] = makeEntity({ id: "entity-Y", commentsCount: 2 });
    const entityX = makeEntity({ id: "entity-X", commentsCount: 7 });
    const { result } = renderSection({
      props: { entityId: "entity-Y" },
      contextEntity: entityX,
    });
    await waitFor(() => expect(result.current.section.entity?.id).toBe("entity-Y"));
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() => pendingPost.promise) as any);
    let created!: Promise<unknown>;
    act(() => {
      created = result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.contextEntity?.commentsCount).toBe(7);
    expect(result.current.section.entity?.commentsCount).toBe(3);
    await act(async () => {
      pendingPost.resolve({ data: makeComment({ id: NEW, entityId: "entity-Y" }), status: 201 });
      await created;
    });
    expect(result.current.contextEntity).toBe(entityX);
    expect(result.current.section.entity?.commentsCount).toBe(3);

    postOnce("fail");
    await result.current.section.createComment({ content: "again" });
    await waitFor(() => expect(result.current.section.submittingComment).toBe(false));
    await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(3));
    expect(result.current.contextEntity).toBe(entityX);
  });

  it("(iv) an `entity` prop: the exposed count is optimistic until the caller's entity catches up; the caller's object is never changed", async () => {
    quiet();
    mockApi();
    const entityA = Object.freeze(makeEntity({ id: "entity-A", commentsCount: 5 })) as Entity;
    const { result, rerender } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    expect(result.current.section.entity).toBe(entityA);

    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() => pendingPost.promise) as any);
    let created!: Promise<unknown>;
    act(() => {
      created = result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);
    expect(entityA.commentsCount).toBe(5);
    await act(async () => {
      pendingPost.resolve({ data: makeComment({ id: NEW, entityId: "entity-A" }), status: 201 });
      await created;
    });
    // Still the caller's stale 5 underneath: the section keeps showing 6.
    expect(result.current.section.entity?.commentsCount).toBe(6);
    expect(result.current.section.entity?.id).toBe("entity-A");

    // An unrelated re-render with the same stale object doesn't lose it.
    rerender({ entity: { ...entityA } });
    expect(result.current.section.entity?.commentsCount).toBe(6);

    // The caller's entity catches up: it is exposed as-is again.
    const caughtUp = { ...entityA, commentsCount: 6 };
    rerender({ entity: caughtUp });
    expect(result.current.section.entity).toBe(caughtUp);
    // ...and stays authoritative afterwards.
    const later = { ...entityA, commentsCount: 9 };
    rerender({ entity: later });
    expect(result.current.section.entity).toBe(later);
  });

  it("(iv) an `entity` prop: a failed create rolls the exposed count back", async () => {
    quiet();
    mockApi();
    const entityA = makeEntity({ id: "entity-A", commentsCount: 5 });
    const { result } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    const pendingPost = deferred();
    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() => pendingPost.promise) as any);
    let created!: Promise<unknown>;
    act(() => {
      created = result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);
    pendingPost.reject(axiosErrorWithStatus(500, {}));
    await created;
    await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(5));
    expect(result.current.section.entity).toBe(entityA);
  });

  it("(iv) an `entity` prop: a different entity supplied by the caller shows its own count", async () => {
    mockApi();
    const entityA = makeEntity({ id: "entity-A", commentsCount: 5 });
    const entityB = makeEntity({ id: "entity-B", commentsCount: 1 });
    const { result, rerender } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() =>
      ok(makeComment({ id: NEW, entityId: "entity-A" }), 201)) as any);
    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);

    rerender({ entity: entityB });
    expect(result.current.section.entity).toBe(entityB);
    // Back on A with the caller's still-stale object: the caller's count.
    rerender({ entity: entityA });
    expect(result.current.section.entity?.commentsCount).toBe(5);
  });
});

describe("C4 — an entity the section can't resolve", () => {
  it("an entity that isn't found ends loading with `error`; loadMore() retries the entity, then the list", async () => {
    quiet();
    const api = mockApi();
    const { result } = renderSection({ props: { entityId: "entity-A" } });

    await waitFor(() => expect(result.current.section.loading).toBe(false));
    expect(result.current.section.error).toBeInstanceOf(Error);
    expect(result.current.section.entity).toBeUndefined();
    expect(result.current.section.comments).toEqual([]);
    expect(api.entityCalls()).toHaveLength(1);
    expect(api.listCalls()).toHaveLength(0);

    // Still failing: one more request, error again.
    await act(async () => {
      await result.current.section.loadMore();
    });
    expect(api.entityCalls()).toHaveLength(2);
    expect(result.current.section.error).toBeInstanceOf(Error);
    expect(result.current.section.loading).toBe(false);

    // Now it exists.
    api.entities["entity-A"] = makeEntity({ id: "entity-A" });
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    await act(async () => {
      await result.current.section.loadMore();
    });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));
    expect(result.current.section.entity?.id).toBe("entity-A");
    expect(result.current.section.error).toBeNull();
    expect(result.current.section.loading).toBe(false);
    expect(api.entityCalls()).toHaveLength(3);
    expect(api.listCalls()).toHaveLength(1);
  });

  it("a network failure fetching the entity is reported the same way", async () => {
    quiet();
    const api = mockApi();
    api.entities["entity-A"] = () => Promise.reject(new Error("Network Error"));
    const { result } = renderSection({ props: { entityId: "entity-A" } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    expect(result.current.section.error?.message).toBe("Network Error");
  });

  it("A → B while B is loading, then B isn't found: A is never exposed as the current entity and nothing is posted to it", async () => {
    quiet();
    const api = mockApi();
    api.entities["entity-A"] = makeEntity({ id: "entity-A", commentsCount: 3 });
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    const pendingB = deferred();
    api.entities["entity-B"] = () => pendingB.promise;
    const post = vi.spyOn(axiosPrivate, "post").mockImplementation((() =>
      ok(makeComment({ id: NEW }), 201)) as any);

    const { result, rerender, renders } = renderSection({ props: { entityId: "entity-A" } });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    const before = renders.length;
    rerender({ entityId: "entity-B" });
    // Pending: no entity, no comments, loading.
    expect(result.current.section.entity).toBeUndefined();
    expect(result.current.section.comments).toEqual([]);
    expect(result.current.section.loading).toBe(true);
    expect(result.current.section.error).toBeNull();
    expect(result.current.section.getComment(A1)).toBeUndefined();

    vi.spyOn(console, "error").mockImplementation(() => {});
    await act(async () => {
      await result.current.section.createComment({ content: "typed for B" });
    });
    expect(post).not.toHaveBeenCalled();

    await act(async () => {
      pendingB.reject(axiosErrorWithStatus(404, { code: "entity/not-found" }));
      await tick();
    });
    expect(result.current.section.loading).toBe(false);
    expect(result.current.section.error).toBeInstanceOf(Error);
    expect(result.current.section.entity).toBeUndefined();
    expect(result.current.section.comments).toEqual([]);

    await act(async () => {
      await result.current.section.createComment({ content: "typed for B" });
    });
    expect(post).not.toHaveBeenCalled();
    // No render after the switch showed A or A's comments.
    for (const r of renders.slice(before)) {
      expect(r.entityId).toBeUndefined();
      expect(r.commentIds).toEqual([]);
    }

    // The retry succeeds.
    api.entities["entity-B"] = makeEntity({ id: "entity-B" });
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);
    await act(async () => {
      await result.current.section.loadMore();
    });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));
    expect(result.current.section.entity?.id).toBe("entity-B");
    expect(result.current.section.error).toBeNull();
  });

  it("going back from a failed entity to the loaded one clears the error; returning retries", async () => {
    quiet();
    const api = mockApi();
    api.entities["entity-A"] = makeEntity({ id: "entity-A" });
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    const { result, rerender } = renderSection({ props: { entityId: "entity-A" } });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(result.current.section.error).toBeInstanceOf(Error));

    rerender({ entityId: "entity-A" });
    expect(result.current.section.error).toBeNull();
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));
    expect(result.current.section.entity?.id).toBe("entity-A");

    api.entities["entity-B"] = makeEntity({ id: "entity-B" });
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);
    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));
    expect(result.current.section.error).toBeNull();
  });
});

describe("C6 — A → B (slow) → A", () => {
  it("B's late response is dropped: the entity never becomes B and B's list is never fetched", async () => {
    const api = mockApi();
    api.entities["entity-A"] = makeEntity({ id: "entity-A" });
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    const pendingB = deferred();
    api.entities["entity-B"] = () => pendingB.promise;
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);

    const { result, rerender, renders } = renderSection({ props: { entityId: "entity-A" } });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(api.entityCalls().some((u) => u.endsWith("/entity-B"))).toBe(true));
    rerender({ entityId: "entity-A" });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    await act(async () => {
      pendingB.resolve({ data: makeEntity({ id: "entity-B" }), status: 200 });
      await tick(40);
    });

    expect(result.current.section.entity?.id).toBe("entity-A");
    expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]);
    expect(renders.some((r) => r.entityId === "entity-B")).toBe(false);
    expect(api.listCalls().some((p) => p.entityId === "entity-B")).toBe(false);

    // Asking for B again later still works (a fresh request).
    api.entities["entity-B"] = makeEntity({ id: "entity-B" });
    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));
    expect(result.current.section.entity?.id).toBe("entity-B");
  });
});

describe("C7 — no render shows one entity over another entity's comments", () => {
  const expectConsistent = (renders: RenderLog[]) => {
    for (const r of renders) {
      if (r.entityId === "entity-B") expect(r.commentIds).not.toContain(A1);
      if (r.entityId === "entity-A") expect(r.commentIds).not.toContain(B1);
    }
  };

  it("`entity` prop switch: the first render on B is already empty and loading", async () => {
    const api = mockApi();
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);
    const { result, rerender, renders } = renderSection({
      props: { entity: makeEntity({ id: "entity-A" }) },
    });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    const before = renders.length;
    rerender({ entity: makeEntity({ id: "entity-B" }) });
    const firstOnB = renders.slice(before).find((r) => r.entityId === "entity-B")!;
    expect(firstOnB).toEqual({ entityId: "entity-B", commentIds: [], loading: true });
    expect(result.current.section.getComment(A1)).toBeUndefined();

    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));
    expectConsistent(renders);
  });

  it("EntityProvider switch", async () => {
    const api = mockApi();
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A" })]);
    api.lists["entity-B"] = page([makeComment({ id: B1, entityId: "entity-B" })]);
    const { result, renders } = renderSection({
      props: {},
      contextEntity: makeEntity({ id: "entity-A" }),
    });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));

    act(() => result.current.setContextEntity!(makeEntity({ id: "entity-B" })));
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([B1]));
    expect(renders.some((r) => r.entityId === "entity-B")).toBe(true);
    expectConsistent(renders);
  });
});

describe("C8 — an optimistic delete survives the comment being re-delivered", () => {
  it("a page that re-delivers the comment mid-delete doesn't bring its content back once the delete succeeds", async () => {
    const api = mockApi();
    const original = makeComment({ id: A1, entityId: "entity-A", content: "still here" });
    api.lists["entity-A"] = page([original], "next");
    const pendingDelete = deferred();
    vi.spyOn(axiosPrivate, "delete").mockImplementation((() => pendingDelete.promise) as any);

    const { result } = renderSection({ props: { entity: makeEntity({ id: "entity-A" }) } });
    await waitFor(() => expect(result.current.section.comments).toHaveLength(1));

    let deleting!: Promise<void>;
    act(() => {
      deleting = result.current.section.deleteComment({ commentId: A1 });
    });
    expect(result.current.section.getComment(A1)?.content).toBeNull();

    // A vote-ranked page overlaps the first and re-delivers the comment as
    // the server still had it.
    api.lists["entity-A"] = page([original, makeComment({ id: A2, entityId: "entity-A" })]);
    await act(async () => {
      await result.current.section.loadMore();
    });
    expect(result.current.section.getComment(A1)?.content).toBe("still here");

    await act(async () => {
      pendingDelete.resolve({ data: undefined, status: 204 });
      await deleting;
    });
    expect(result.current.section.getComment(A1)?.content).toBeNull();
    expect(result.current.section.getComment(A1)?.userDeletedAt).toBeTruthy();
    expect(result.current.section.getComment(A1)?.user).toBeNull();
  });

  it("a delete the server refuses leaves the placeholder in place (no rollback)", async () => {
    quiet();
    const api = mockApi();
    api.lists["entity-A"] = page([makeComment({ id: A1, entityId: "entity-A", content: "mine" })]);
    vi.spyOn(axiosPrivate, "delete").mockImplementation((() =>
      Promise.reject(axiosErrorWithStatus(403, {}))) as any);
    const { result } = renderSection({ props: { entity: makeEntity({ id: "entity-A" }) } });
    await waitFor(() => expect(result.current.section.comments).toHaveLength(1));

    await result.current.section.deleteComment({ commentId: A1 });
    await waitFor(() => expect(result.current.section.getComment(A1)?.content).toBeNull());
    await tick();
    expect(result.current.section.getComment(A1)?.userDeletedAt).toBeTruthy();
  });
});

describe("C9 — createComment never throws", () => {
  it("a too-short comment without a commentTooShortCallback resolves undefined", async () => {
    mockApi();
    const post = vi.spyOn(axiosPrivate, "post");
    const { result } = renderSection({ props: { entity: makeEntity({ id: "entity-A" }) } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    await expect(result.current.section.createComment({ content: "a" })).resolves.toBeUndefined();
    await expect(result.current.section.createComment({})).resolves.toBeUndefined();
    expect(post).not.toHaveBeenCalled();
  });

  it("the callback is still called when provided", async () => {
    mockApi();
    const tooShort = vi.fn();
    const { result } = renderSection({
      props: {
        entity: makeEntity({ id: "entity-A" }),
        callbacks: { commentTooShortCallback: tooShort },
      },
    });
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    await result.current.section.createComment({ content: "a" });
    expect(tooShort).toHaveBeenCalledTimes(1);
  });
});

describe("follow-up — the count overlay and a caller's count that goes down", () => {
  it("any later change to the caller's count drops the overlay, not only catching up", async () => {
    mockApi();
    const entityA = makeEntity({ id: "entity-A", commentsCount: 5 });
    const { result, rerender } = renderSection({ props: { entity: entityA } });
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    vi.spyOn(axiosPrivate, "post").mockImplementationOnce((() =>
      ok(makeComment({ id: NEW, entityId: "entity-A" }), 201)) as any);
    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    expect(result.current.section.entity?.commentsCount).toBe(6);

    const four = { ...entityA, commentsCount: 4 };
    rerender({ entity: four });
    expect(result.current.section.entity).toBe(four);
    const three = { ...entityA, commentsCount: 3 };
    rerender({ entity: three });
    expect(result.current.section.entity).toBe(three);
    // Gone for good: the original stale object doesn't bring it back.
    rerender({ entity: entityA });
    expect(result.current.section.entity?.commentsCount).toBe(5);
  });
});

describe("follow-up — id props are compared as strings", () => {
  it("a numeric `foreignId` resolves to the entity the server returns with the string id", async () => {
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation(((url: string) => {
      if (url.endsWith("/entities/by-foreign-id")) {
        return ok(makeEntity({ id: "entity-A", foreignId: "123" }));
      }
      return ok(page([makeComment({ id: A1, entityId: "entity-A" })]));
    }) as any);
    const { result } = renderSection({ props: { foreignId: 123 as unknown as string } });
    await waitFor(() => expect(result.current.section.comments.map((c) => c.id)).toEqual([A1]));
    expect(result.current.section.entity?.id).toBe("entity-A");
    expect(result.current.section.error).toBeNull();
    expect(
      get.mock.calls.filter((c) => String(c[0]).endsWith("/entities/by-foreign-id")),
    ).toHaveLength(1);
  });

  it("a supplied entity matches a numeric `foreignId` without a lookup", async () => {
    const api = mockApi();
    const { result } = renderSection({
      props: {
        foreignId: 123 as unknown as string,
        entity: makeEntity({ id: "entity-A", foreignId: "123" }),
      },
    });
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    expect(result.current.section.entity?.id).toBe("entity-A");
    expect(api.entityCalls()).toHaveLength(0);
  });

  it("an `entityId` in another letter case is the same entity; `shortId` stays exact", async () => {
    const lower = "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa";
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation(((url: string) => {
      if (/\/entities\/[^/]+$/.test(url)) return ok(makeEntity({ id: lower, shortId: "AbC" }));
      return ok(page([]));
    }) as any);
    const { result, rerender } = renderSection({ props: { entityId: lower.toUpperCase() } });
    await waitFor(() => expect(result.current.section.entity?.id).toBe(lower));
    expect(result.current.section.error).toBeNull();

    quiet();
    rerender({ shortId: "abc" });
    await waitFor(() => expect(result.current.section.error).toBeInstanceOf(Error));
    expect(result.current.section.entity).toBeUndefined();
    expect(get).toHaveBeenCalled();
  });
});

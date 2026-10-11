import React, { useState } from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
  makeSublayStore,
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

afterEach(() => resetAxiosMocks());

const A1 = "11111111-1111-4111-8111-111111111111";
const B1 = "22222222-2222-4222-8222-222222222222";
const NEW = "33333333-3333-4333-8333-333333333333";

const ok = (data: unknown, status = 200) =>
  Promise.resolve({ data, status, statusText: "OK", headers: {}, config: {} } as any);
const page = (data: Comment[]) => ({ data, pagination: { nextCursor: null, hasMore: false } });

/** Lists comments per entity; counts the list requests. */
function mockLists(byEntity: Record<string, Comment[]>) {
  const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string, config?: any) => {
    if (url.endsWith("/comments")) {
      return ok(page(byEntity[config?.params?.entityId] ?? []));
    }
    return ok(page([]));
  });
  const listCalls = () =>
    get.mock.calls.filter((c) => String(c[0]).endsWith("/comments"));
  return { get, listCalls };
}

describe("useCommentSectionData — the `entity` prop changing", () => {
  it("a new object for the same entity keeps the store, doesn't refetch, and is the entity the section exposes", async () => {
    const entity = makeEntity({ id: "entity-A", commentsCount: 1 });
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
    });

    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { entity } } as any,
    );
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.comments.map((c) => c.id)).toEqual([A1]);
    expect(listCalls()).toHaveLength(1);

    const loadingSeen: boolean[] = [];
    const bumped = { ...entity, commentsCount: 2 };
    rerender({ entity: bumped });
    loadingSeen.push(result.current.loading);
    await new Promise((r) => setTimeout(r, 30));
    loadingSeen.push(result.current.loading);

    expect(listCalls()).toHaveLength(1);
    expect(loadingSeen).toEqual([false, false]);
    expect(result.current.comments.map((c) => c.id)).toEqual([A1]);
    expect(result.current.entity).toBe(bumped);
    expect(result.current.entity?.commentsCount).toBe(2);
  });

  it("a different entity resets the section and loads that entity's comments", async () => {
    const entityA = makeEntity({ id: "entity-A" });
    const entityB = makeEntity({ id: "entity-B" });
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
      "entity-B": [makeComment({ id: B1, entityId: "entity-B" })],
    });

    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { entity: entityA } } as any,
    );
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));

    rerender({ entity: entityB });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([B1]));
    expect(result.current.entity).toBe(entityB);
    expect(result.current.getComment(A1)).toBeUndefined();
    expect(listCalls()).toHaveLength(2);
    expect(listCalls()[1][1]?.params).toMatchObject({ entityId: "entity-B" });
  });

  it("an entity that arrives after the first render is picked up", async () => {
    const entity = makeEntity({ id: "entity-A" });
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
    });

    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { entity: undefined } } as any,
    );
    expect(result.current.entity).toBeUndefined();

    rerender({ entity });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));
    expect(result.current.entity).toBe(entity);
    expect(listCalls()).toHaveLength(1);
  });

  it("a new `callbacks` object doesn't refetch or drop the store", async () => {
    const entity = makeEntity({ id: "entity-A" });
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
    });

    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { entity, callbacks: { loginRequiredCallback: () => {} } } } as any,
    );
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));

    rerender({ entity, callbacks: { loginRequiredCallback: () => {} } });
    await new Promise((r) => setTimeout(r, 30));
    expect(listCalls()).toHaveLength(1);
    expect(result.current.loading).toBe(false);
    expect(result.current.comments.map((c) => c.id)).toEqual([A1]);
  });

  it("an entity in context that doesn't match the requested id never replaces the fetched one", async () => {
    const other = makeEntity({ id: "entity-OTHER", commentsCount: 0 });
    const requested = makeEntity({ id: "entity-A" });
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith("/entities/entity-A")) return ok(requested);
      return ok(page([]));
    });

    const store = makeSublayStore();
    store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
    store.dispatch(setUser(null));
    store.dispatch(setInitialized(true));
    function Wrapper({ children }: { children: React.ReactNode }) {
      const [current, setCurrent] = useState<Entity | null | undefined>(other);
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
      () => ({
        section: useCommentSectionData({ entityId: "entity-A" }),
        setContextEntity: useEntity().setEntity!,
      }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.section.entity?.id).toBe("entity-A"));
    await waitFor(() => expect(result.current.section.loading).toBe(false));

    act(() => result.current.setContextEntity({ ...other, commentsCount: 9 }));
    await new Promise((r) => setTimeout(r, 30));
    expect(result.current.section.entity?.id).toBe("entity-A");
    expect(get.mock.calls.filter((c) => String(c[0]).endsWith("/comments"))).toHaveLength(1);
  });

  it("a fresh object for the same entity on every render settles: one list fetch, no render loop", async () => {
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
    });
    let renders = 0;
    const { result } = renderHookWithAxios(() => {
      renders += 1;
      // What calling the hook with an inline object does.
      return useCommentSectionData({
        entity: makeEntity({ id: "entity-A", commentsCount: 1 }),
      });
    });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));
    await new Promise((r) => setTimeout(r, 50));
    const settled = renders;
    await new Promise((r) => setTimeout(r, 100));
    expect(renders).toBe(settled);
    expect(renders).toBeLessThan(20);
    expect(listCalls()).toHaveLength(1);
    expect(result.current.entity?.id).toBe("entity-A");
  });

  it("with `foreignId` inside an EntityProvider, the section's own slower fetch doesn't replace the context entity, which is kept if the context empties", async () => {
    let resolveOwnFetch!: (v: unknown) => void;
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.endsWith("/entities/by-foreign-id")) {
        return new Promise((resolve) => {
          resolveOwnFetch = resolve;
        }) as any;
      }
      return ok(page([]));
    });

    const store = makeSublayStore();
    store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
    store.dispatch(setUser(null));
    store.dispatch(setInitialized(true));
    function Wrapper({ children }: { children: React.ReactNode }) {
      const [current, setCurrent] = useState<Entity | null | undefined>(undefined);
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
      () => ({
        section: useCommentSectionData({ foreignId: "article-1" }),
        setContextEntity: useEntity().setEntity!,
      }),
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(resolveOwnFetch).toBeDefined());

    // The EntityProvider's entity arrives first, already at 5 comments.
    const fromContext = makeEntity({ id: "entity-A", foreignId: "article-1", commentsCount: 5 });
    act(() => result.current.setContextEntity(fromContext));
    await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(5));

    // The section's own fetch lands late with an older copy.
    await act(async () => {
      resolveOwnFetch({
        data: makeEntity({ id: "entity-A", foreignId: "article-1", commentsCount: 1 }),
        status: 200,
      });
      await new Promise((r) => setTimeout(r, 20));
    });
    expect(result.current.section.entity?.commentsCount).toBe(5);

    // The context empties: the section keeps the entity it was following.
    act(() => result.current.setContextEntity(undefined));
    await new Promise((r) => setTimeout(r, 20));
    expect(result.current.section.entity?.commentsCount).toBe(5);
    expect(get.mock.calls.filter((c) => String(c[0]).endsWith("/comments"))).toHaveLength(1);
  });
});

describe("useCommentSectionData — entity passed from EntityProvider's context", () => {
  it("posting a comment bumps the entity's commentsCount without resetting the section", async () => {
    const entity = makeEntity({ id: "entity-A", commentsCount: 1 });
    const { listCalls } = mockLists({
      "entity-A": [makeComment({ id: A1, entityId: "entity-A" })],
    });
    vi.spyOn(axiosPrivate, "post").mockImplementation(() =>
      ok(makeComment({ id: NEW, entityId: "entity-A", content: "hello" }), 201),
    );

    const store = makeSublayStore();
    store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
    store.dispatch(setUser(makeAuthUser({ id: "user-1", username: "alice" })));
    store.dispatch(setInitialized(true));
    function Wrapper({ children }: { children: React.ReactNode }) {
      const [current, setCurrent] = useState<Entity | null | undefined>(entity);
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
    // What a developer writes: `entity={entity}` from `useEntity()`.
    const { result } = renderHook(
      () => {
        const { entity: fromContext } = useEntity();
        return { section: useCommentSectionData({ entity: fromContext }), fromContext };
      },
      { wrapper: Wrapper },
    );
    await waitFor(() => expect(result.current.section.loading).toBe(false));
    expect(listCalls()).toHaveLength(1);

    await act(async () => {
      await result.current.section.createComment({ content: "hello" });
    });
    await new Promise((r) => setTimeout(r, 30));

    expect(result.current.fromContext?.commentsCount).toBe(2);
    expect(result.current.section.entity?.commentsCount).toBe(2);
    expect(listCalls()).toHaveLength(1);
    expect(result.current.section.loading).toBe(false);
    expect(result.current.section.getComment(A1)).toBeDefined();
    expect(result.current.section.getComment(NEW)).toBeDefined();
  });
});

describe("useCommentSectionData — the wanted entity changing by id", () => {
  const forms = [
    { prop: "entityId", a: "entity-A", b: "entity-B" },
    { prop: "foreignId", a: "article-A", b: "article-B" },
    { prop: "shortId", a: "shortA", b: "shortB" },
  ] as const;

  it.each(forms)("$prop: A → B → A ends on A, with one entity fetch per switch", async ({ prop, a, b }) => {
    const entityFor = (wanted: string) =>
      makeEntity({
        id: wanted === a ? "entity-A" : "entity-B",
        foreignId: prop === "foreignId" ? wanted : null,
        shortId: prop === "shortId" ? wanted : "other",
      } as Partial<Entity>);
    const get = vi.spyOn(axiosPrivate, "get").mockImplementation((url: string, config?: any) => {
      if (url.endsWith("/comments")) {
        const entityId = config?.params?.entityId;
        return ok(page([makeComment({ id: entityId === "entity-A" ? A1 : B1, entityId })]));
      }
      if (url.includes("/entities/")) {
        const wanted =
          config?.params?.foreignId ?? config?.params?.shortId ?? url.split("/").pop();
        return ok(entityFor(wanted));
      }
      return ok(page([]));
    });
    const entityFetches = () =>
      get.mock.calls.filter((c) => String(c[0]).includes("/entities/")).length;

    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { [prop]: a }, reactStrictMode: true } as any,
    );
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));
    expect(entityFetches()).toBe(1);

    // The same id again: nothing is fetched.
    rerender({ [prop]: a });
    await new Promise((r) => setTimeout(r, 20));
    expect(entityFetches()).toBe(1);

    rerender({ [prop]: b });
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([B1]));
    expect(result.current.entity?.id).toBe("entity-B");
    expect(entityFetches()).toBe(2);

    rerender({ [prop]: a });
    await waitFor(() => expect(result.current.entity?.id).toBe("entity-A"));
    await waitFor(() => expect(result.current.comments.map((c) => c.id)).toEqual([A1]));
    expect(entityFetches()).toBe(3);
  });

  it("a fetch for an entity the section has moved on from is dropped", async () => {
    const pending: Record<string, (v: unknown) => void> = {};
    vi.spyOn(axiosPrivate, "get").mockImplementation((url: string) => {
      if (url.includes("/entities/")) {
        return new Promise((resolve) => {
          pending[url.split("/").pop()!] = resolve;
        }) as any;
      }
      return ok(page([]));
    });
    const { result, rerender } = renderHookWithAxios(
      (p: UseCommentSectionDataProps) => useCommentSectionData(p),
      { initialProps: { entityId: "entity-A" } } as any,
    );
    await waitFor(() => expect(pending["entity-A"]).toBeDefined());
    rerender({ entityId: "entity-B" });
    await waitFor(() => expect(pending["entity-B"]).toBeDefined());

    await act(async () => {
      pending["entity-B"]({ data: makeEntity({ id: "entity-B" }), status: 200 });
      await new Promise((r) => setTimeout(r, 10));
      pending["entity-A"]({ data: makeEntity({ id: "entity-A" }), status: 200 });
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(result.current.entity?.id).toBe("entity-B");
  });
});

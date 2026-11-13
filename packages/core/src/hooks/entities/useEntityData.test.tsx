import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import React from "react";
import { render, renderHook } from "@testing-library/react";
import { Provider } from "react-redux";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeEntity,
  makeAuthUser,
  makeUser,
  makeSpace,
  makeSublayStore,
  mockAxiosPrivate,
} from "../../test-utils";
import { SublayContext, type SublayContextValues } from "../../context/sublay-context";
import { EntityProvider } from "../../context/entity-context";
import useEntity from "./useEntity";
import useUpdateEntity from "./useUpdateEntity";
import { setUser } from "../../store/slices/authSlice";
import useEntityData, { type UseEntityDataProps } from "./useEntityData";

afterEach(() => {
  resetAxiosMocks();
});

describe("useEntityData", () => {
  it("resolves an entity by entityId and caches it for the same ID on a later render", async () => {
    const entityOne = makeEntity({ id: "entity-1" });
    const entityTwo = makeEntity({ id: "entity-2" });

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entityOne),
      },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entityOne));

    axiosPrivate.mockResponse("get", entityTwo);
    rerender({ entityId: "entity-2" } as UseEntityDataProps);
    await waitFor(() => expect(result.current.entity).toEqual(entityTwo));

    rerender({ entityId: "entity-1" } as UseEntityDataProps);
    await waitFor(() => expect(result.current.entity).toEqual(entityOne));

    // Only 2 GET calls total: the cached entity-1 lookup on the 3rd render
    // didn't trigger a 3rd request.
    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("resolves an entity by foreignId, passing createIfNotFound through", async () => {
    const entity = makeEntity({ foreignId: "ext-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityData({ foreignId: "ext-1", createIfNotFound: true }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity),
      },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-foreign-id");
    expect(call.config?.params).toMatchObject({
      foreignId: "ext-1",
      createIfNotFound: true,
    });
  });

  it("resolves an entity by shortId", async () => {
    const entity = makeEntity({ shortId: "short-1" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityData({ shortId: "short-1" }),
      {
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity),
      },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-short-id");
  });

  it("uses a directly-provided entity prop without fetching", async () => {
    const entity = makeEntity({ id: "entity-1" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({ entity }),
    );

    expect(result.current.entity).toEqual(entity);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("does not throw and leaves entity unset when the fetch fails", async () => {
    const { result } = renderHookWithAxios(
      () => useEntityData({ entityId: "entity-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.entity).toBeUndefined());
  });

  it("updates the entity via updateEntity", async () => {
    const entity = makeEntity({ id: "entity-1", title: "Old" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({ entity }),
    );

    const updated = { ...entity, title: "New" };
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current.updateEntity({ update: { title: "New" } });
    });

    expect(returned).toEqual(updated);
    expect(result.current.entity).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/entities/entity-1");
    expect(call.body).toMatchObject({ title: "New" });
  });

  it("no-ops updateEntity when there is no entity yet", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({} as UseEntityDataProps),
    );

    let returned;
    await act(async () => {
      returned = await result.current.updateEntity({ update: { title: "New" } });
    });

    expect(returned).toBeUndefined();
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });

  it("deletes the entity via deleteEntity and clears local state", async () => {
    const entity = makeEntity({ id: "entity-1" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({ entity }),
    );

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.deleteEntity();
    });

    expect(result.current.entity).toBeUndefined();

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/entities/entity-1");
  });

  it("does not throw when deleteEntity's request fails", async () => {
    const entity = makeEntity({ id: "entity-1" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({ entity }),
    );

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      act(async () => {
        await result.current.deleteEntity();
      }),
    ).resolves.not.toThrow();
  });
});

describe("useEntityData — signed-in user changes", () => {
  it("fetches the entity again, past its cache, when the user signs out or switches accounts", async () => {
    const asUserA = makeEntity({ id: "entity-1", userReaction: "upvote" });
    const signedOut = makeEntity({ id: "entity-1", userReaction: null });
    const asUserB = makeEntity({ id: "entity-1", userReaction: "downvote" });

    const { result, axiosPrivate, store } = renderHookWithAxios(
      () => useEntityData({ entityId: "entity-1" }),
      {
        user: makeAuthUser({ id: "user-a" }),
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", asUserA),
      },
    );

    await waitFor(() => expect(result.current.entity?.userReaction).toBe("upvote"));

    axiosPrivate.mockResponse("get", signedOut);
    act(() => {
      store.dispatch(setUser(null));
    });
    await waitFor(() => expect(result.current.entity?.userReaction).toBeNull());

    axiosPrivate.mockResponse("get", asUserB);
    act(() => {
      store.dispatch(setUser(makeAuthUser({ id: "user-b" })));
    });
    await waitFor(() => expect(result.current.entity?.userReaction).toBe("downvote"));

    expect(axiosPrivate.calls("get")).toHaveLength(3);
  });

  it("leaves an entity passed in as a prop as it is", async () => {
    const entity = makeEntity({ id: "entity-1", userReaction: "upvote" });

    const { result, axiosPrivate, store } = renderHookWithAxios(
      () => useEntityData({ entity }),
      { user: makeAuthUser({ id: "user-a" }) },
    );

    act(() => {
      store.dispatch(setUser(null));
    });

    expect(result.current.entity).toEqual(entity);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

describe("useEntityData — entity prop", () => {
  // REGRESSION (#233): an inline `entity` object is a fresh reference every
  // render. Held raw in the sync effect's deps, any re-render set state, which
  // re-rendered, which set state again: an endless loop. (Mount alone didn't
  // loop: the first sync sets the same object the state started with.)
  it("does not loop when re-rendered with an inline entity prop", async () => {
    const base = makeEntity({ id: "entity-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(() => {
      renders += 1;
      // The old code looped synchronously; fail instead of hanging.
      if (renders > 50) throw new Error("render loop");
      return useEntityData({ entity: { ...base } } as UseEntityDataProps);
    });

    for (let i = 0; i < 3; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(renders).toBeLessThan(10);
    expect(result.current.entity).toEqual(base);
  });

  it("still takes an entity prop whose content really changes", async () => {
    const base = makeEntity({ id: "entity-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(
      (props: { value: string }) => {
        renders += 1;
        if (renders > 50) throw new Error("render loop");
        return useEntityData({ entity: { ...base, title: props.value } } as UseEntityDataProps);
      },
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    await waitFor(() => expect(result.current.entity?.title).toBe("second"));
  });
  it("follows a list's copy passed in as the prop when its nested fields change", async () => {
    const base = makeEntity({
      id: "entity-1",
      saved: { isSaved: false, collections: [] },
    });
    const { result, rerender } = renderHookWithAxios(
      (props: { entity: typeof base }) =>
        useEntityData({ entity: props.entity } as UseEntityDataProps),
      { initialProps: { entity: base } },
    );

    const updated = {
      ...base,
      userReaction: "upvote" as const,
      reactionCounts: { ...base.reactionCounts, upvote: 1 },
      saved: { isSaved: true, collections: [{ id: "c1", name: "Reading" }] },
    };
    rerender({ entity: updated });
    await waitFor(() => expect(result.current.entity).toEqual(updated));
  });
  describe("after an edit", () => {
    const held = () =>
      makeEntity({
        id: "entity-1",
        title: "Old",
        userReaction: "upvote",
        user: makeUser({ id: "author", avatarFileId: "file-1" }),
        space: makeSpace({ id: "space-1" }),
        saved: { isSaved: true, collections: [{ id: "c1", name: "Reading" }] },
      });
    // As the server answers an edit: no `saved` / `space`, a null
    // `userReaction`, and the author without files.
    const response = () =>
      makeEntity({
        id: "entity-1",
        title: "New",
        updatedAt: "2024-02-01T00:00:00.000Z",
        userReaction: null,
        user: makeUser({ id: "author" }),
      });
    const expected = () => ({
      ...held(),
      title: "New",
      updatedAt: "2024-02-01T00:00:00.000Z",
    });

    it("updateEntity keeps what the response lacks or doesn't fill for the viewer", async () => {
      const { result, axiosPrivate } = renderHookWithAxios(() =>
        useEntityData({ entity: held() }),
      );
      axiosPrivate.mockResponse("patch", response());

      await act(async () => {
        await result.current.updateEntity({ update: { title: "New" } });
      });

      expect(result.current.entity).toEqual(expected());
    });

    it("useUpdateEntity inside an EntityProvider applies the edit the same way", async () => {
      const store = makeSublayStore();
      const axiosPrivate = mockAxiosPrivate();
      axiosPrivate.mockResponse("patch", response());
      const entity = held();
      function Wrapper({ children }: { children: React.ReactNode }) {
        return (
          <Provider store={store}>
            <SublayContext.Provider
              value={{ projectId: "test-project", project: null } as SublayContextValues}
            >
              <EntityProvider entity={entity}>{children}</EntityProvider>
            </SublayContext.Provider>
          </Provider>
        );
      }
      const { result } = renderHook(
        () => ({ provided: useEntity().entity, updateEntity: useUpdateEntity() }),
        { wrapper: Wrapper },
      );

      await act(async () => {
        await result.current.updateEntity({ entityId: "entity-1", update: { title: "New" } });
      });

      expect(result.current.provided).toEqual(expected());
    });
  });
});

describe("useUpdateEntity / updateEntity with more than one EntityProvider", () => {
  const A = makeEntity({ id: "A", title: "A" });
  const B = makeEntity({ id: "B", title: "B" });

  function renderTree(tree: (probe: React.ReactNode) => React.ReactNode, probe: React.ReactNode) {
    const store = makeSublayStore();
    const axiosPrivate = mockAxiosPrivate();
    axiosPrivate.mockResponse("patch", { ...B, title: "B2" });
    return render(
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          {tree(probe)}
        </SublayContext.Provider>
      </Provider>,
    );
  }

  it("an edit of B inside A's provider leaves A's entity as it is", async () => {
    const seen: { outer?: string | null } = {};
    let updateEntity!: ReturnType<typeof useUpdateEntity>;
    function Probe() {
      updateEntity = useUpdateEntity();
      seen.outer = useEntity().entity?.title;
      return null;
    }
    renderTree((probe) => <EntityProvider entity={A}>{probe}</EntityProvider>, <Probe />);
    expect(seen.outer).toBe("A");

    await act(async () => {
      await updateEntity({ entityId: "B", update: { title: "B2" } });
    });
    expect(seen.outer).toBe("A");
  });

  it("an inner provider's own updateEntity updates the inner provider, not the outer one", async () => {
    const seen: { outer?: string | null; inner?: string | null } = {};
    let inner!: ReturnType<typeof useEntity>;
    function Outer() {
      seen.outer = useEntity().entity?.title;
      return null;
    }
    function Inner() {
      inner = useEntity();
      seen.inner = inner.entity?.title;
      return null;
    }
    renderTree(
      (probe) => (
        <EntityProvider entity={A}>
          <Outer />
          <EntityProvider entity={B}>{probe}</EntityProvider>
        </EntityProvider>
      ),
      <Inner />,
    );

    await act(async () => {
      await inner.updateEntity!({ update: { title: "B2" } });
    });
    expect(seen.inner).toBe("B2");
    expect(seen.outer).toBe("A");
  });
});

describe("useEntityData — include and top-comment options", () => {
  const waitABit = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

  it("sends include on the by-id fetch, joined with commas", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityData({ entityId: "entity-1", include: ["user", "space"] }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity) },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/entity-1");
    expect(call.config?.params).toMatchObject({ include: "user,space" });
  });

  it("sends include and the top-comment options on the short-id fetch", async () => {
    const entity = makeEntity({ shortId: "short-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityData({
          shortId: "short-1",
          include: ["topComments"],
          topCommentsLimit: 3,
          topCommentsSortByReaction: "like",
        }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity) },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-short-id");
    expect(call.config?.params).toMatchObject({
      shortId: "short-1",
      include: "topComments",
      topCommentsLimit: 3,
      topCommentsSortByReaction: "like",
    });
  });

  it("sends include on the foreign-id fetch", async () => {
    const entity = makeEntity({ foreignId: "ext-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityData({ foreignId: "ext-1", include: "user" }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity) },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));
    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/entities/by-foreign-id");
    expect(call.config?.params).toMatchObject({ foreignId: "ext-1", include: "user" });
    expect(call.config?.params).not.toHaveProperty("createIfNotFound");
  });

  it("sends include and the top-comment options on the fetch-or-create", async () => {
    const entity = makeEntity({ foreignId: "ext-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityData({
          foreignId: "ext-1",
          createIfNotFound: true,
          include: ["space", "topComments"],
          topCommentsLimit: 2,
        }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity, 201) },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));
    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({
      foreignId: "ext-1",
      createIfNotFound: true,
      include: "space,topComments",
      topCommentsLimit: 2,
    });
  });

  it("leaves the top-comment options out when include doesn't ask for topComments", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () =>
        useEntityData({
          entityId: "entity-1",
          include: "user",
          topCommentsLimit: 3,
          topCommentsSortByReaction: "like",
        }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity) },
    );

    await waitFor(() => expect(result.current.entity).toEqual(entity));
    const params = axiosPrivate.calls("get")[0].config?.params;
    expect(params).not.toHaveProperty("topCommentsLimit");
    expect(params).not.toHaveProperty("topCommentsSortByReaction");
  });

  it("fetches again when include changes, and uses the cache when it changes back", async () => {
    const plain = makeEntity({ id: "entity-1", title: "plain" });
    const withUser = makeEntity({ id: "entity-1", title: "with user", user: makeUser() });

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", plain),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("plain"));

    axiosPrivate.mockResponse("get", withUser);
    rerender({ entityId: "entity-1", include: ["user"] });
    await waitFor(() => expect(result.current.entity?.title).toBe("with user"));
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({ include: "user" });

    rerender({ entityId: "entity-1" });
    await waitFor(() => expect(result.current.entity?.title).toBe("plain"));

    // The same include as a single value is the same request, so the cache.
    rerender({ entityId: "entity-1", include: "user" });
    await waitFor(() => expect(result.current.entity?.title).toBe("with user"));

    await waitABit();
    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("fetches again when a top-comment option changes with include=topComments", async () => {
    const first = makeEntity({ id: "entity-1", title: "limit 1" });
    const second = makeEntity({ id: "entity-1", title: "limit 3" });

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: { limit: number }) =>
        useEntityData({
          entityId: "entity-1",
          include: ["topComments"],
          topCommentsLimit: props.limit,
        }),
      {
        initialProps: { limit: 1 },
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", first),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("limit 1"));

    axiosPrivate.mockResponse("get", second);
    rerender({ limit: 3 });
    await waitFor(() => expect(result.current.entity?.title).toBe("limit 3"));
    expect(axiosPrivate.calls("get")[1].config?.params).toMatchObject({ topCommentsLimit: 3 });
  });

  it("doesn't fetch again when a top-comment option changes without include=topComments", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: { limit: number }) =>
        useEntityData({ entityId: "entity-1", include: "user", topCommentsLimit: props.limit }),
      {
        initialProps: { limit: 1 },
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity),
      },
    );
    await waitFor(() => expect(result.current.entity).toEqual(entity));

    rerender({ limit: 3 });
    await waitABit();
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("doesn't loop or fetch again when re-rendered with the same inline include array", async () => {
    const entity = makeEntity({ id: "entity-1" });
    let renders = 0;
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      () => {
        renders += 1;
        if (renders > 50) throw new Error("render loop");
        return useEntityData({ entityId: "entity-1", include: ["user", "space"] });
      },
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", entity) },
    );
    await waitFor(() => expect(result.current.entity).toEqual(entity));

    for (let i = 0; i < 3; i += 1) rerender();
    await waitABit();

    expect(renders).toBeLessThan(15);
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("drops a response to a request made for options that have since changed", async () => {
    let resolveSlow!: (value: unknown) => void;
    const plain = makeEntity({ id: "entity-1", title: "plain" });
    const withUser = makeEntity({ id: "entity-1", title: "with user" });
    const seen: (string | null | undefined)[] = [];

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => {
        const data = useEntityData(props);
        seen.push(data.entity?.title);
        return data;
      },
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => {
          vi.spyOn(axiosPrivate.instance, "get").mockImplementationOnce(
            () => new Promise((resolve) => (resolveSlow = resolve)),
          );
        },
      },
    );

    axiosPrivate.mockResponse("get", withUser);
    rerender({ entityId: "entity-1", include: "user" });
    await waitFor(() => expect(result.current.entity?.title).toBe("with user"));

    await act(async () => {
      resolveSlow({ data: plain, status: 200 });
    });
    await waitABit();
    expect(result.current.entity?.title).toBe("with user");
    expect(seen).not.toContain("plain");
  });

  it("ignores the options for an entity passed in", async () => {
    const entity = makeEntity({ id: "entity-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEntityData({ entity, include: ["user"], topCommentsLimit: 2 }),
    );

    await waitABit();
    expect(result.current.entity).toEqual(entity);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("takes the options next to either an entity or an id from one conditional object", () => {
    // Type-level: the options are allowed on every variant, so a caller can
    // pick the identifier at runtime and pass `include` once.
    const pick = (e: ReturnType<typeof makeEntity> | null): UseEntityDataProps => {
      const source = e ? { entity: e } : { entityId: "entity-1" };
      return { ...source, include: "user" };
    };
    expect(pick(null)).toMatchObject({ entityId: "entity-1", include: "user" });
  });

  it("fetches again with the same include when the user signs out", async () => {
    const signedIn = makeEntity({ id: "entity-1", userReaction: "upvote" });
    const signedOut = makeEntity({ id: "entity-1", userReaction: null });

    const { result, axiosPrivate, store } = renderHookWithAxios(
      () => useEntityData({ entityId: "entity-1", include: ["user", "saved"] }),
      {
        user: makeAuthUser({ id: "user-a" }),
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", signedIn),
      },
    );
    await waitFor(() => expect(result.current.entity?.userReaction).toBe("upvote"));

    axiosPrivate.mockResponse("get", signedOut);
    act(() => {
      store.dispatch(setUser(null));
    });
    await waitFor(() => expect(result.current.entity?.userReaction).toBeNull());

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[1].config?.params).toMatchObject({ include: "user,saved" });
  });
});

describe("useEntityData — requests superseded or undone", () => {
  const waitABit = () =>
    act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 30));
    });

  // Makes the next GET wait until the returned function is called.
  function holdNextGet(axiosPrivate: { instance: { get: unknown } }) {
    let release!: (data: unknown) => void;
    // The harness already spies on `get`; queue on that same spy so its
    // recorded calls still include this one.
    vi.mocked(axiosPrivate.instance.get as () => Promise<unknown>).mockImplementationOnce(
      (() =>
        new Promise((resolve) => {
          release = (data) => resolve({ data, status: 200 });
        })) as never,
    );
    return (data: unknown) =>
      act(async () => {
        release(data);
      });
  }

  it("options A → B → A before B lands: B's response is dropped", async () => {
    const plain = makeEntity({ id: "entity-1", title: "plain" });
    const seen: (string | null | undefined)[] = [];
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => {
        const data = useEntityData(props);
        seen.push(data.entity?.title);
        return data;
      },
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", plain),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("plain"));

    const releaseB = holdNextGet(axiosPrivate);
    rerender({ entityId: "entity-1", include: "user" });
    rerender({ entityId: "entity-1" });
    await releaseB(makeEntity({ id: "entity-1", title: "with user" }));
    await waitABit();

    expect(result.current.entity?.title).toBe("plain");
    expect(seen).not.toContain("with user");
  });

  it("ids X → Y → X before Y lands: Y's response is dropped", async () => {
    const x = makeEntity({ id: "X", title: "X" });
    const seen: (string | null | undefined)[] = [];
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => {
        const data = useEntityData(props);
        seen.push(data.entity?.title);
        return data;
      },
      {
        initialProps: { entityId: "X" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", x),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("X"));

    const releaseY = holdNextGet(axiosPrivate);
    rerender({ entityId: "Y" });
    rerender({ entityId: "X" });
    await releaseY(makeEntity({ id: "Y", title: "Y" }));
    await waitABit();

    expect(result.current.entity?.title).toBe("X");
    expect(seen).not.toContain("Y");
  });

  it("switching to an entity prop while a fetch is in flight drops that fetch", async () => {
    const given = makeEntity({ id: "given", title: "given" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      { initialProps: { entityId: "Y" } as UseEntityDataProps },
    );
    const releaseY = holdNextGet(axiosPrivate);
    rerender({ entityId: "Z" });
    rerender({ entity: given });
    await releaseY(makeEntity({ id: "Z", title: "Z" }));
    await waitABit();

    expect(result.current.entity?.title).toBe("given");
  });

  it("an edit under options A survives A → B → A", async () => {
    const a = makeEntity({ id: "entity-1", title: "old" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", a),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("old"));

    axiosPrivate.mockResponse("patch", { ...a, title: "edited" });
    await act(async () => {
      await result.current.updateEntity({ update: { title: "edited" } });
    });

    axiosPrivate.mockResponse("get", { ...a, title: "edited", user: makeUser() });
    rerender({ entityId: "entity-1", include: "user" });
    await waitFor(() => expect(result.current.entity?.user).toBeTruthy());

    rerender({ entityId: "entity-1" });
    await waitABit();
    expect(result.current.entity?.title).toBe("edited");
  });

  it("an edit under options B isn't undone by A's older cached copy", async () => {
    const a = makeEntity({ id: "entity-1", title: "old" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", a),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("old"));

    axiosPrivate.mockResponse("get", { ...a, user: makeUser() });
    rerender({ entityId: "entity-1", include: "user" });
    await waitFor(() => expect(result.current.entity?.user).toBeTruthy());

    act(() => {
      result.current.setEntity((current) => current && { ...current, commentsCount: 9 });
    });

    axiosPrivate.mockResponse("get", { ...a, commentsCount: 9 });
    rerender({ entityId: "entity-1" });
    await waitABit();
    expect(result.current.entity?.commentsCount).toBe(9);
  });

  it("a deleted entity isn't brought back from the cache", async () => {
    const a = makeEntity({ id: "entity-1" });
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useEntityData({ entityId: "entity-1" }),
      { beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", a) },
    );
    await waitFor(() => expect(result.current.entity).toEqual(a));

    axiosPrivate.mockResponse("delete", undefined, 204);
    await act(async () => {
      await result.current.deleteEntity();
    });
    await waitABit();

    expect(result.current.entity).toBeUndefined();
    expect(axiosPrivate.calls("get")).toHaveLength(1);
  });

  it("local changes during an options-change fetch don't start more requests", async () => {
    const a = makeEntity({ id: "entity-1", title: "plain" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEntityDataProps) => useEntityData(props),
      {
        initialProps: { entityId: "entity-1" } as UseEntityDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", a),
      },
    );
    await waitFor(() => expect(result.current.entity?.title).toBe("plain"));

    const releaseB = holdNextGet(axiosPrivate);
    rerender({ entityId: "entity-1", include: "user" });
    act(() => {
      result.current.setEntity((c) => c && { ...c, commentsCount: 1 });
    });
    act(() => {
      result.current.setEntity((c) => c && { ...c, commentsCount: 2 });
    });
    await releaseB({ ...a, title: "with user" });
    await waitABit();

    expect(axiosPrivate.calls("get")).toHaveLength(2);
    expect(result.current.entity?.title).toBe("with user");
  });
});

describe("EntityProvider — include", () => {
  it("passes include through to its fetch", async () => {
    const store = makeSublayStore();
    const axiosPrivate = mockAxiosPrivate();
    const entity = makeEntity({ id: "entity-1" });
    axiosPrivate.mockResponse("get", entity);
    function Wrapper({ children }: { children: React.ReactNode }) {
      return (
        <Provider store={store}>
          <SublayContext.Provider
            value={{ projectId: "test-project", project: null } as SublayContextValues}
          >
            <EntityProvider entityId="entity-1" include={["user", "space"]}>
              {children}
            </EntityProvider>
          </SublayContext.Provider>
        </Provider>
      );
    }
    const { result } = renderHook(() => useEntity().entity, { wrapper: Wrapper });

    await waitFor(() => expect(result.current).toEqual(entity));
    expect(axiosPrivate.calls("get")[0].config?.params).toMatchObject({
      include: "user,space",
    });
  });
});

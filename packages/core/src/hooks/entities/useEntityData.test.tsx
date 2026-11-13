import { describe, it, expect, afterEach } from "vitest";
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

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { act, cleanup } from "@testing-library/react";

import {
  renderHookWithStore,
  stubFetchMock,
  unstubFetchMock,
  jsonResponse,
  type FetchMockHandle,
} from "../../test-utils";
import { useCollectionsActions } from "./useCollectionsActions";
import {
  selectCurrentCollection,
  selectCollectionsLoading,
  selectCollectionEntities,
  setCollectionEntities,
} from "../../store/slices/collectionsSlice";
import type { Collection } from "../../interfaces/models/Collection";
import type { Entity } from "../../interfaces/models/Entity";

let fetchHandle: FetchMockHandle;

const ROOT: Collection = {
  id: "root",
  projectId: "test-project",
  userId: "user-1",
  parentId: null,
  name: "Root",
  entityCount: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
};

const makeEntity = (overrides: Partial<Entity> = {}): Entity =>
  ({ id: "entity-1", ...overrides } as Entity);

beforeEach(() => {
  fetchHandle = stubFetchMock(async () => jsonResponse({}, 404));
});

afterEach(() => {
  cleanup();
  unstubFetchMock();
});

describe("useCollectionsActions", () => {
  it("openCollection/goBack/goToRoot dispatch the matching slice actions", async () => {
    const { result, store } = renderHookWithStore(() => useCollectionsActions());

    act(() => result.current.openCollection(ROOT));
    expect(selectCurrentCollection(store.getState())).toEqual(ROOT);

    act(() =>
      result.current.openCollection({ ...ROOT, id: "child", parentId: "root" }),
    );
    act(() => result.current.goBack());
    expect(selectCurrentCollection(store.getState())?.id).toBe("root");

    act(() =>
      result.current.openCollection({ ...ROOT, id: "child", parentId: "root" }),
    );
    act(() => result.current.goToRoot());
    expect(selectCurrentCollection(store.getState())?.id).toBe("root");
  });

  it("fetchRootCollection sets the current collection and toggles loading", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(ROOT));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());

    await act(async () => {
      await result.current.fetchRootCollection({ projectId: "test-project" });
    });

    expect(selectCurrentCollection(store.getState())).toEqual(ROOT);
    expect(selectCollectionsLoading(store.getState())).toBe(false);
  });

  it("fetchRootCollection leaves state untouched and stops loading on failure", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());

    await act(async () => {
      await result.current.fetchRootCollection({ projectId: "test-project" });
    });

    expect(selectCurrentCollection(store.getState())).toBeNull();
    expect(selectCollectionsLoading(store.getState())).toBe(false);
  });

  it("fetchSubCollections maps the result under the parent collection", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse([{ ...ROOT, id: "child", parentId: "root" }]),
    );
    const { result, store } = renderHookWithStore(() => useCollectionsActions());

    await act(async () => {
      await result.current.fetchSubCollections({ projectId: "test-project", collectionId: "root" });
    });

    expect(store.getState().sublay.collections.subcollectionsMap.root).toEqual(["child"]);
  });

  it("createCollection adds and navigates into the new collection", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ ...ROOT, id: "child", parentId: "root" }, 201),
    );
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    act(() => result.current.openCollection(ROOT));

    await act(async () => {
      await result.current.createCollection({
        projectId: "test-project",
        parentCollectionId: "root",
        name: "My List",
      });
    });

    expect(selectCurrentCollection(store.getState())?.id).toBe("child");
  });

  it("createCollection is a no-op when required params are missing", async () => {
    const { result } = renderHookWithStore(() => useCollectionsActions());

    await act(async () => {
      await result.current.createCollection({
        projectId: "",
        parentCollectionId: "root",
        name: "My List",
      });
    });

    expect(fetchHandle.calls()).toHaveLength(0);
  });

  it("updateCollection patches the collection in the store", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ ...ROOT, name: "Renamed" }));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    act(() => result.current.openCollection(ROOT));

    await act(async () => {
      await result.current.updateCollection({
        projectId: "test-project",
        collectionId: "root",
        update: { name: "Renamed" },
      });
    });

    expect(selectCurrentCollection(store.getState())?.name).toBe("Renamed");
  });

  it("deleteCollection removes the collection from the store", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse(undefined));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    act(() => result.current.openCollection(ROOT));

    await act(async () => {
      await result.current.deleteCollection({ projectId: "test-project", collection: ROOT });
    });

    expect(selectCurrentCollection(store.getState())).toBeNull();
  });

  it("addToCollection optimistically prepends, then keeps the entity on success", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, collection: { id: "root", entityCount: 1 } }),
    );
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    const entity = makeEntity();

    await act(async () => {
      await result.current.addToCollection({
        projectId: "test-project",
        collectionId: "root",
        entity,
      });
    });

    expect(selectCollectionEntities("root")(store.getState())).toEqual([entity]);
  });

  it("addToCollection reverts the optimistic prepend on failure", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    const entity = makeEntity();

    await act(async () => {
      await expect(
        result.current.addToCollection({
          projectId: "test-project",
          collectionId: "root",
          entity,
        }),
      ).rejects.toBeTruthy();
    });

    expect(selectCollectionEntities("root")(store.getState())).toEqual([]);
  });

  it("removeFromCollection optimistically removes, then keeps it removed on success", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(
      jsonResponse({ success: true, collection: { id: "root", entityCount: 0 } }),
    );
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    const entity = makeEntity();
    act(() =>
      store.dispatch(setCollectionEntities({ collectionId: "root", entities: [entity] })),
    );

    await act(async () => {
      await result.current.removeFromCollection({
        projectId: "test-project",
        collectionId: "root",
        entityId: entity.id,
      });
    });

    expect(selectCollectionEntities("root")(store.getState())).toEqual([]);
  });

  it("removeFromCollection restores the entity at its original index on failure", async () => {
    fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    const entityA = makeEntity({ id: "a" });
    const entityB = makeEntity({ id: "b" });
    act(() =>
      store.dispatch(
        setCollectionEntities({ collectionId: "root", entities: [entityA, entityB] }),
      ),
    );

    await act(async () => {
      await expect(
        result.current.removeFromCollection({
          projectId: "test-project",
          collectionId: "root",
          entityId: "a",
        }),
      ).rejects.toBeTruthy();
    });

    expect(
      selectCollectionEntities("root")(store.getState()).map((e) => e.id),
    ).toEqual(["a", "b"]);
  });

  it("resetCollections clears the slice back to its initial state", async () => {
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    act(() => result.current.openCollection(ROOT));
    act(() => result.current.resetCollections());
    expect(selectCurrentCollection(store.getState())).toBeNull();
  });
});

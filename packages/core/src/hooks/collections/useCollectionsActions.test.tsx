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
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
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
      jsonResponse({ data: [{ ...ROOT, id: "child", parentId: "root" }] }),
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

  describe("loaded entity lists", () => {
    const LATER: Collection = { ...ROOT, id: "later", parentId: "root", name: "Later" };
    const savedIn = (...collections: Array<{ id: string; name: string }>) =>
      makeEntity({
        title: "Kept",
        saved: { isSaved: collections.length > 0, collections },
      });
    const seedLists = (store: ReturnType<typeof renderHookWithStore>["store"], entity: Entity) =>
      act(() => {
        store.dispatch(setEntityListEntities({ listId: "withSaved", entities: [entity] }));
        store.dispatch(
          setEntityListEntities({ listId: "noSaved", entities: [makeEntity({ title: "Kept" })] }),
        );
      });
    const lists = (store: ReturnType<typeof renderHookWithStore>["store"]) =>
      store.getState().sublay.entityLists.lists;

    it("addToCollection appends the collection to copies that have `saved`", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ success: true, collection: { id: "later", entityCount: 1 } }),
      );
      const { result, store } = renderHookWithStore(() => useCollectionsActions());
      act(() => result.current.openCollection(LATER));
      seedLists(store, savedIn({ id: "root", name: "Root" }));

      await act(async () => {
        await result.current.addToCollection({
          projectId: "test-project",
          collectionId: "later",
          entity: makeEntity(),
        });
      });

      expect(lists(store).withSaved.entities[0]).toEqual(
        savedIn({ id: "root", name: "Root" }, { id: "later", name: "Later" }),
      );
      expect(lists(store).noSaved.entities[0]).toEqual(makeEntity({ title: "Kept" }));
    });

    it("addToCollection sets only `isSaved` when the collection's name isn't loaded", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(
        jsonResponse({ success: true, collection: { id: "unknown", entityCount: 1 } }),
      );
      const { result, store } = renderHookWithStore(() => useCollectionsActions());
      seedLists(store, savedIn());

      await act(async () => {
        await result.current.addToCollection({
          projectId: "test-project",
          collectionId: "unknown",
          entity: makeEntity(),
        });
      });

      expect(lists(store).withSaved.entities[0].saved).toEqual({ isSaved: true, collections: [] });
    });

    it("addToCollection leaves the lists as they are on failure", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useCollectionsActions());
      act(() => result.current.openCollection(LATER));
      seedLists(store, savedIn());
      const before = store.getState().sublay.entityLists;

      await act(async () => {
        await expect(
          result.current.addToCollection({
            projectId: "test-project",
            collectionId: "later",
            entity: makeEntity(),
          }),
        ).rejects.toBeTruthy();
      });

      expect(store.getState().sublay.entityLists).toBe(before);
    });

    it("removeFromCollection drops the collection and updates `isSaved`", async () => {
      fetchHandle.fetchMock.mockResolvedValue(
        jsonResponse({ success: true, collection: { id: "root", entityCount: 0 } }),
      );
      const { result, store } = renderHookWithStore(() => useCollectionsActions());
      seedLists(store, savedIn({ id: "root", name: "Root" }, { id: "later", name: "Later" }));

      await act(async () => {
        await result.current.removeFromCollection({
          projectId: "test-project",
          collectionId: "root",
          entityId: "entity-1",
        });
      });
      expect(lists(store).withSaved.entities[0]).toEqual(savedIn({ id: "later", name: "Later" }));

      fetchHandle.fetchMock.mockResolvedValue(
        jsonResponse({ success: true, collection: { id: "later", entityCount: 0 } }),
      );
      await act(async () => {
        await result.current.removeFromCollection({
          projectId: "test-project",
          collectionId: "later",
          entityId: "entity-1",
        });
      });
      expect(lists(store).withSaved.entities[0]).toEqual(savedIn());
      expect(lists(store).noSaved.entities[0]).toEqual(makeEntity({ title: "Kept" }));
    });

    it("removeFromCollection leaves the lists as they are on failure", async () => {
      fetchHandle.fetchMock.mockResolvedValueOnce(jsonResponse({ message: "boom" }, 500));
      const { result, store } = renderHookWithStore(() => useCollectionsActions());
      seedLists(store, savedIn({ id: "root", name: "Root" }));
      const before = store.getState().sublay.entityLists;

      await act(async () => {
        await expect(
          result.current.removeFromCollection({
            projectId: "test-project",
            collectionId: "root",
            entityId: "entity-1",
          }),
        ).rejects.toBeTruthy();
      });

      expect(store.getState().sublay.entityLists).toBe(before);
    });
  });

  it("resetCollections clears the slice back to its initial state", async () => {
    const { result, store } = renderHookWithStore(() => useCollectionsActions());
    act(() => result.current.openCollection(ROOT));
    act(() => result.current.resetCollections());
    expect(selectCurrentCollection(store.getState())).toBeNull();
  });
});

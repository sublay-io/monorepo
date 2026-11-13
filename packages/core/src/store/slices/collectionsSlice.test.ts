import { describe, it, expect } from "vitest";

import reducer, {
  setProjectContext,
  setLoading,
  openCollection,
  goBack,
  goToRoot,
  setCurrentCollection,
  setSubCollections,
  updateCurrentCollection,
  updateCollectionInSubCollections,
  addNewCollectionAndNavigate,
  removeCollectionFromSubCollections,
  handleCollectionDeletion,
  setCollectionEntities,
  appendCollectionEntities,
  prependCollectionEntity,
  removeCollectionEntity,
  insertCollectionEntityAt,
  resetCollections,
  handleError,
  selectCurrentCollection,
  selectSubCollections,
  selectCollectionsLoading,
  selectCollectionHistory,
  selectSubCollectionsMap,
  selectCollectionsById,
  selectCurrentProjectId,
  selectCurrentCollectionId,
  selectCollectionEntities,
  type CollectionsState,
} from "./collectionsSlice";
import type { Collection } from "../../interfaces/models/Collection";
import type { Entity } from "../../interfaces/models/Entity";

const makeCollection = (overrides: Partial<Collection> = {}): Collection => ({
  id: "col-1",
  projectId: "project-1",
  userId: "user-1",
  parentId: null,
  name: "Root",
  entityCount: 0,
  createdAt: "2024-01-01T00:00:00.000Z",
  updatedAt: "2024-01-01T00:00:00.000Z",
  ...overrides,
});

const makeEntity = (overrides: Partial<Entity> = {}): Entity =>
  ({ id: "entity-1", ...overrides } as Entity);

const initial: CollectionsState = {
  collectionsById: {},
  subcollectionsMap: {},
  currentCollectionId: null,
  collectionHistory: [],
  loading: false,
  currentProjectId: undefined,
  entitiesByCollectionId: {},
  deletedCollectionIds: {},
};

describe("collectionsSlice", () => {
  it("setProjectContext and setLoading set their respective fields", () => {
    let s = reducer(initial, setProjectContext("project-1"));
    expect(s.currentProjectId).toBe("project-1");
    s = reducer(s, setLoading(true));
    expect(s.loading).toBe(true);
  });

  describe("navigation", () => {
    it("openCollection stores the collection, pushes history, and sets it current", () => {
      const root = makeCollection({ id: "root" });
      let s = reducer(initial, openCollection(root));
      expect(s.collectionsById.root).toEqual(root);
      expect(s.currentCollectionId).toBe("root");
      expect(s.collectionHistory).toEqual([]);

      const child = makeCollection({ id: "child", parentId: "root" });
      s = reducer(s, openCollection(child));
      expect(s.currentCollectionId).toBe("child");
      expect(s.collectionHistory).toEqual(["root"]);
    });

    it("openCollection does not overwrite an already-stored collection", () => {
      const root = makeCollection({ id: "root", name: "Original" });
      let s = reducer(initial, openCollection(root));
      s = reducer(s, openCollection({ ...root, name: "Renamed" }));
      expect(s.collectionsById.root.name).toBe("Original");
    });

    it("goBack pops history and restores the previous collection", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "child", parentId: "root" })));
      s = reducer(s, goBack());
      expect(s.currentCollectionId).toBe("root");
      expect(s.collectionHistory).toEqual([]);
    });

    it("goBack is a no-op when history is empty", () => {
      const s = reducer(initial, goBack());
      expect(s).toEqual(initial);
    });

    it("goToRoot jumps to the first history entry and clears history", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "mid", parentId: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "leaf", parentId: "mid" })));
      s = reducer(s, goToRoot());
      expect(s.currentCollectionId).toBe("root");
      expect(s.collectionHistory).toEqual([]);
    });

    it("goToRoot is a no-op when history is empty", () => {
      const s = reducer(initial, goToRoot());
      expect(s).toEqual(initial);
    });
  });

  it("setCurrentCollection stores+selects a collection, or clears when null", () => {
    const root = makeCollection({ id: "root" });
    let s = reducer(initial, setCurrentCollection(root));
    expect(s.currentCollectionId).toBe("root");
    expect(s.collectionsById.root).toEqual(root);

    s = reducer(s, setCurrentCollection(null));
    expect(s.currentCollectionId).toBeNull();
  });

  it("setSubCollections stores each collection and maps them to the parent", () => {
    const a = makeCollection({ id: "a" });
    const b = makeCollection({ id: "b" });
    const s = reducer(
      initial,
      setSubCollections({ collections: [a, b], parentCollectionId: "root" }),
    );
    expect(s.subcollectionsMap.root).toEqual(["a", "b"]);
    expect(s.collectionsById.a).toEqual(a);
    expect(s.collectionsById.b).toEqual(b);
  });

  it("updateCurrentCollection and updateCollectionInSubCollections both upsert collectionsById", () => {
    const root = makeCollection({ id: "root", name: "Old" });
    let s = reducer(initial, openCollection(root));

    s = reducer(s, updateCurrentCollection({ ...root, name: "New" }));
    expect(s.collectionsById.root.name).toBe("New");

    s = reducer(s, updateCollectionInSubCollections({ ...root, name: "Newer" }));
    expect(s.collectionsById.root.name).toBe("Newer");
  });

  describe("addNewCollectionAndNavigate", () => {
    it("stores, navigates to, and maps the new collection under its parent", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      const child = makeCollection({ id: "child", parentId: "root" });
      s = reducer(s, addNewCollectionAndNavigate(child));

      expect(s.currentCollectionId).toBe("child");
      expect(s.collectionHistory).toEqual(["root"]);
      expect(s.subcollectionsMap.root).toEqual(["child"]);
    });

    it("is a no-op when there is no current collection", () => {
      const s = reducer(initial, addNewCollectionAndNavigate(makeCollection()));
      expect(s).toEqual(initial);
    });

    it("does not duplicate an id already present under the parent", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      const child = makeCollection({ id: "child", parentId: "root" });
      s = reducer(s, addNewCollectionAndNavigate(child));
      s = reducer(s, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, addNewCollectionAndNavigate(child));
      expect(s.subcollectionsMap.root).toEqual(["child"]);
    });
  });

  it("removeCollectionFromSubCollections removes the collection and all parent references", () => {
    let s = reducer(
      initial,
      setSubCollections({
        collections: [makeCollection({ id: "a" }), makeCollection({ id: "b" })],
        parentCollectionId: "root",
      }),
    );
    s = reducer(s, removeCollectionFromSubCollections("a"));
    expect(s.collectionsById.a).toBeUndefined();
    expect(s.subcollectionsMap.root).toEqual(["b"]);
  });

  describe("handleCollectionDeletion", () => {
    it("removes the collection, its entities, and its parent mapping", () => {
      let s = reducer(
        initial,
        setSubCollections({
          collections: [makeCollection({ id: "child", parentId: "root" })],
          parentCollectionId: "root",
        }),
      );
      s = reducer(s, setCollectionEntities({ collectionId: "child", entities: [makeEntity()] }));

      s = reducer(s, handleCollectionDeletion({ collectionId: "child", parentId: "root" }));
      expect(s.collectionsById.child).toBeUndefined();
      expect(s.subcollectionsMap.root).toEqual([]);
      expect(s.entitiesByCollectionId.child).toBeUndefined();
    });

    it("navigates back when the deleted collection was current and history exists", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "child", parentId: "root" })));
      s = reducer(s, handleCollectionDeletion({ collectionId: "child", parentId: "root" }));
      expect(s.currentCollectionId).toBe("root");
    });

    it("clears currentCollectionId when the deleted collection was current and history is empty", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, handleCollectionDeletion({ collectionId: "root" }));
      expect(s.currentCollectionId).toBeNull();
    });

    it("removes every id in deletedCollectionIds, with their mappings and entities", () => {
      let s = reducer(
        initial,
        setSubCollections({
          collections: [
            makeCollection({ id: "child", parentId: "root" }),
            makeCollection({ id: "sibling", parentId: "root" }),
          ],
          parentCollectionId: "root",
        }),
      );
      s = reducer(
        s,
        setSubCollections({
          collections: [makeCollection({ id: "grandchild", parentId: "child" })],
          parentCollectionId: "child",
        }),
      );
      s = reducer(s, setCollectionEntities({ collectionId: "child", entities: [makeEntity()] }));
      s = reducer(s, setCollectionEntities({ collectionId: "grandchild", entities: [makeEntity()] }));

      s = reducer(
        s,
        handleCollectionDeletion({
          collectionId: "child",
          parentId: "root",
          deletedCollectionIds: ["child", "grandchild", "never-loaded"],
        }),
      );
      expect(Object.keys(s.collectionsById)).toEqual(["sibling"]);
      expect(s.subcollectionsMap).toEqual({ root: ["sibling"] });
      expect(s.entitiesByCollectionId).toEqual({});
    });

    it("keeps deleted collections from coming back through late updates", () => {
      let s = reducer(
        initial,
        handleCollectionDeletion({
          collectionId: "child",
          parentId: "root",
          deletedCollectionIds: ["child", "grandchild"],
        }),
      );
      expect(s.deletedCollectionIds).toEqual({ child: true, grandchild: true });

      s = reducer(s, setCollectionEntities({ collectionId: "child", entities: [makeEntity()] }));
      s = reducer(s, appendCollectionEntities({ collectionId: "child", entities: [makeEntity()] }));
      s = reducer(s, prependCollectionEntity({ collectionId: "grandchild", entity: makeEntity() }));
      s = reducer(
        s,
        insertCollectionEntityAt({ collectionId: "grandchild", entity: makeEntity(), index: 0 }),
      );
      s = reducer(s, updateCollectionInSubCollections(makeCollection({ id: "child" })));
      expect(s.entitiesByCollectionId).toEqual({});
      expect(s.collectionsById).toEqual({});

      s = reducer(s, resetCollections());
      expect(s.deletedCollectionIds).toEqual({ child: true, grandchild: true });
    });

    it("goes back past deleted collections in the history", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "child", parentId: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "grandchild", parentId: "child" })));
      s = reducer(
        s,
        handleCollectionDeletion({
          collectionId: "child",
          parentId: "root",
          deletedCollectionIds: ["child", "grandchild"],
        }),
      );
      expect(s.currentCollectionId).toBe("root");
      expect(s.collectionHistory).toEqual([]);
    });
  });

  describe("collection entity list management", () => {
    it("setCollectionEntities replaces the list for a collection", () => {
      const s = reducer(
        initial,
        setCollectionEntities({ collectionId: "col-1", entities: [makeEntity({ id: "e1" })] }),
      );
      expect(s.entitiesByCollectionId["col-1"]).toHaveLength(1);
    });

    it("appendCollectionEntities appends to an existing or missing list", () => {
      let s = reducer(
        initial,
        appendCollectionEntities({ collectionId: "col-1", entities: [makeEntity({ id: "e1" })] }),
      );
      s = reducer(
        s,
        appendCollectionEntities({ collectionId: "col-1", entities: [makeEntity({ id: "e2" })] }),
      );
      expect(s.entitiesByCollectionId["col-1"].map((e) => e.id)).toEqual(["e1", "e2"]);
    });

    it("prependCollectionEntity inserts at the front", () => {
      let s = reducer(
        initial,
        setCollectionEntities({ collectionId: "col-1", entities: [makeEntity({ id: "e1" })] }),
      );
      s = reducer(s, prependCollectionEntity({ collectionId: "col-1", entity: makeEntity({ id: "e0" }) }));
      expect(s.entitiesByCollectionId["col-1"].map((e) => e.id)).toEqual(["e0", "e1"]);
    });

    it("removeCollectionEntity filters out the matching id, no-ops if list missing", () => {
      let s = reducer(
        initial,
        setCollectionEntities({
          collectionId: "col-1",
          entities: [makeEntity({ id: "e1" }), makeEntity({ id: "e2" })],
        }),
      );
      s = reducer(s, removeCollectionEntity({ collectionId: "col-1", entityId: "e1" }));
      expect(s.entitiesByCollectionId["col-1"].map((e) => e.id)).toEqual(["e2"]);

      const unchanged = reducer(initial, removeCollectionEntity({ collectionId: "missing", entityId: "e1" }));
      expect(unchanged.entitiesByCollectionId).toEqual({});
    });

    it("insertCollectionEntityAt inserts at the given index, clamped to list length", () => {
      let s = reducer(
        initial,
        setCollectionEntities({
          collectionId: "col-1",
          entities: [makeEntity({ id: "e1" }), makeEntity({ id: "e2" })],
        }),
      );
      s = reducer(s, insertCollectionEntityAt({ collectionId: "col-1", entity: makeEntity({ id: "e1.5" }), index: 1 }));
      expect(s.entitiesByCollectionId["col-1"].map((e) => e.id)).toEqual(["e1", "e1.5", "e2"]);

      s = reducer(s, insertCollectionEntityAt({ collectionId: "col-1", entity: makeEntity({ id: "last" }), index: 999 }));
      expect(s.entitiesByCollectionId["col-1"].map((e) => e.id)).toEqual(["e1", "e1.5", "e2", "last"]);
    });
  });

  it("resetCollections clears everything except nothing is preserved", () => {
    let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
    s = reducer(s, setLoading(true));
    s = reducer(s, setCollectionEntities({ collectionId: "root", entities: [makeEntity()] }));
    s = reducer(s, resetCollections());
    expect(s.collectionsById).toEqual({});
    expect(s.subcollectionsMap).toEqual({});
    expect(s.currentCollectionId).toBeNull();
    expect(s.collectionHistory).toEqual([]);
    expect(s.loading).toBe(false);
    expect(s.entitiesByCollectionId).toEqual({});
  });

  it("handleError stops loading", () => {
    const s = reducer({ ...initial, loading: true }, handleError());
    expect(s.loading).toBe(false);
  });

  describe("selectors", () => {
    it("selectCurrentCollection / selectCurrentCollectionId read the current collection", () => {
      const root = makeCollection({ id: "root" });
      const s = reducer(initial, openCollection(root));
      const state = { sublay: { collections: s } } as never;
      expect(selectCurrentCollection(state)).toEqual(root);
      expect(selectCurrentCollectionId(state)).toBe("root");
    });

    it("selectCurrentCollection returns null when nothing is current", () => {
      const state = { sublay: { collections: initial } } as never;
      expect(selectCurrentCollection(state)).toBeNull();
    });

    it("selectSubCollections resolves ids through collectionsById, dropping unknown ids", () => {
      const a = makeCollection({ id: "a" });
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, setSubCollections({ collections: [a], parentCollectionId: "root" }));
      s = { ...s, subcollectionsMap: { root: ["a", "ghost"] } };
      const subs = selectSubCollections({ sublay: { collections: s } } as never);
      expect(subs).toEqual([a]);
    });

    it("selectCollectionsLoading / selectSubCollectionsMap / selectCollectionsById / selectCurrentProjectId pass through state", () => {
      const s = reducer(initial, setProjectContext("project-1"));
      const state = { sublay: { collections: { ...s, loading: true } } } as never;
      expect(selectCollectionsLoading(state)).toBe(true);
      expect(selectSubCollectionsMap(state)).toEqual({});
      expect(selectCollectionsById(state)).toEqual({});
      expect(selectCurrentProjectId(state)).toBe("project-1");
    });

    it("selectCollectionHistory resolves history ids through collectionsById", () => {
      let s = reducer(initial, openCollection(makeCollection({ id: "root" })));
      s = reducer(s, openCollection(makeCollection({ id: "child", parentId: "root" })));
      const history = selectCollectionHistory({ sublay: { collections: s } } as never);
      expect(history.map((c) => c.id)).toEqual(["root"]);
    });

    it("selectCollectionEntities reads by id and falls back to an empty array", () => {
      const s = reducer(
        initial,
        setCollectionEntities({ collectionId: "col-1", entities: [makeEntity()] }),
      );
      const state = { sublay: { collections: s } } as never;
      expect(selectCollectionEntities("col-1")(state)).toHaveLength(1);
      expect(selectCollectionEntities("missing")(state)).toEqual([]);
      expect(selectCollectionEntities(null)(state)).toEqual([]);
    });
  });
});

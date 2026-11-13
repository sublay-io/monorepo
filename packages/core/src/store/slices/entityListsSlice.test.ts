import { describe, it, expect } from "vitest";

import reducer, {
  initializeList,
  updateFiltersAndSortConfig,
  setEntityListLoading,
  setEntityListEntities,
  incrementPage,
  setEntityListHasMore,
  setEntityListError,
  addEntity,
  removeEntity,
  updateEntityInLists,
  updateKeywordsFilters,
  cleanupList,
  cleanupOldLists,
  selectEntityList,
  selectEntityListEntities,
  selectEntityListLoading,
  selectEntityListHasMore,
  selectEntityListSort,
  selectEntityListFilters,
  selectEntityListConfig,
  type EntityListsState,
} from "./entityListsSlice";
import type { Entity } from "../../interfaces/models/Entity";

const makeEntity = (id: string): Entity => ({ id } as Entity);

const initial: EntityListsState = { lists: {} };

describe("entityListsSlice", () => {
  it("initializeList creates default state once, idempotently", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    expect(s.lists.feed).toMatchObject({ page: 1, limit: 10, sortBy: "hot", entities: [] });

    s = reducer(s, setEntityListLoading({ listId: "feed", loading: false }));
    const s2 = reducer(s, initializeList({ listId: "feed" }));
    expect(s2.lists.feed.loading).toBe(false); // not reset back to the default `true`
  });

  describe("updateFiltersAndSortConfig", () => {
    it("creates the list if missing, applies filters/sort/config, and resets pagination", () => {
      const s = reducer(
        initial,
        updateFiltersAndSortConfig({
          listId: "feed",
          filters: { userId: "user-1", followedOnly: true },
          sort: { sortBy: "createdAt", sortDir: "asc" },
          config: { sourceId: "source-1", limit: 25 },
        }),
      );
      const list = s.lists.feed;
      expect(list.userId).toBe("user-1");
      expect(list.followedOnly).toBe(true);
      expect(list.sortBy).toBe("createdAt");
      expect(list.sortDir).toBe("asc");
      expect(list.sourceId).toBe("source-1");
      expect(list.limit).toBe(25);
      expect(list.page).toBe(1);
      expect(list.hasMore).toBe(true);
      expect(list.error).toBeNull();
    });

    it("ignores undefined filter values but applies explicit nulls", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(
        s,
        updateFiltersAndSortConfig({
          listId: "feed",
          filters: { userId: undefined, timeFrame: null },
        }),
      );
      expect(s.lists.feed.userId).toBeNull(); // untouched default
      expect(s.lists.feed.timeFrame).toBeNull();
    });

    it("resetFilters resets only filter properties, leaving sort/config alone", () => {
      let s = reducer(
        initial,
        updateFiltersAndSortConfig({
          listId: "feed",
          filters: { userId: "user-1" },
          sort: { sortBy: "createdAt" },
          config: { limit: 25 },
        }),
      );
      s = reducer(s, updateFiltersAndSortConfig({ listId: "feed", filters: {}, options: { resetFilters: true } }));
      expect(s.lists.feed.userId).toBeNull();
      expect(s.lists.feed.sortBy).toBe("createdAt"); // untouched
      expect(s.lists.feed.limit).toBe(25); // untouched
    });

    it("resetSort resets only sort properties, leaving filters/config alone", () => {
      let s = reducer(
        initial,
        updateFiltersAndSortConfig({
          listId: "feed",
          filters: { userId: "user-1" },
          sort: { sortBy: "createdAt" },
        }),
      );
      s = reducer(s, updateFiltersAndSortConfig({ listId: "feed", filters: {}, options: { resetSort: true } }));
      expect(s.lists.feed.sortBy).toBe("hot");
      expect(s.lists.feed.userId).toBe("user-1"); // untouched
    });

    it("config fields apply independently, including explicit null for sourceId/spaceId", () => {
      let s = reducer(
        initial,
        updateFiltersAndSortConfig({ listId: "feed", filters: {}, config: { sourceId: "source-1" } }),
      );
      s = reducer(s, updateFiltersAndSortConfig({ listId: "feed", filters: {}, config: { sourceId: null } }));
      expect(s.lists.feed.sourceId).toBeNull();
    });
  });

  it("setEntityListLoading is a no-op for a missing list", () => {
    const s = reducer(initial, setEntityListLoading({ listId: "missing", loading: true }));
    expect(s).toEqual(initial);
  });

  describe("setEntityListEntities", () => {
    it("creates the list if missing and replaces entities by default", () => {
      const s = reducer(
        initial,
        setEntityListEntities({ listId: "feed", entities: [makeEntity("e1")] }),
      );
      expect(s.lists.feed.entities.map((e) => e.id)).toEqual(["e1"]);
      expect(s.lists.feed.loading).toBe(false);
      expect(s.lists.feed.lastFetched).not.toBeNull();
    });

    it("appends and de-dupes by id when append is true", () => {
      let s = reducer(
        initial,
        setEntityListEntities({ listId: "feed", entities: [makeEntity("e1")] }),
      );
      s = reducer(
        s,
        setEntityListEntities({
          listId: "feed",
          entities: [makeEntity("e1"), makeEntity("e2")],
          append: true,
        }),
      );
      expect(s.lists.feed.entities.map((e) => e.id)).toEqual(["e1", "e2"]);
    });
  });

  describe("incrementPage", () => {
    it("increments the page for an existing list", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(s, incrementPage("feed"));
      expect(s.lists.feed.page).toBe(2);
    });

    it("is a no-op for a missing list", () => {
      const s = reducer(initial, incrementPage("missing"));
      expect(s).toEqual(initial);
    });
  });

  it("setEntityListHasMore and setEntityListError set their fields (and error also stops loading)", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    s = reducer(s, setEntityListHasMore({ listId: "feed", hasMore: false }));
    expect(s.lists.feed.hasMore).toBe(false);

    s = reducer(s, setEntityListError({ listId: "feed", error: "boom" }));
    expect(s.lists.feed.error).toBe("boom");
    expect(s.lists.feed.loading).toBe(false);
  });

  describe("addEntity / removeEntity", () => {
    it("addEntity inserts first by default, or last when requested; no-ops for a missing list", () => {
      let s = reducer(
        initial,
        setEntityListEntities({ listId: "feed", entities: [makeEntity("e1")] }),
      );
      s = reducer(s, addEntity({ listId: "feed", entity: makeEntity("e0") }));
      expect(s.lists.feed.entities.map((e) => e.id)).toEqual(["e0", "e1"]);

      s = reducer(s, addEntity({ listId: "feed", entity: makeEntity("e2"), insertPosition: "last" }));
      expect(s.lists.feed.entities.map((e) => e.id)).toEqual(["e0", "e1", "e2"]);

      const unchanged = reducer(initial, addEntity({ listId: "missing", entity: makeEntity("e1") }));
      expect(unchanged).toEqual(initial);
    });

    it("removeEntity filters the matching id; no-ops for a missing list", () => {
      let s = reducer(
        initial,
        setEntityListEntities({ listId: "feed", entities: [makeEntity("e1"), makeEntity("e2")] }),
      );
      s = reducer(s, removeEntity({ listId: "feed", entityId: "e1" }));
      expect(s.lists.feed.entities.map((e) => e.id)).toEqual(["e2"]);

      const unchanged = reducer(initial, removeEntity({ listId: "missing", entityId: "e1" }));
      expect(unchanged).toEqual(initial);
    });
  });

  describe("updateEntityInLists", () => {
    const withLists = (lists: Record<string, Entity[]>): EntityListsState =>
      Object.entries(lists).reduce(
        (s, [listId, entities]) => reducer(s, setEntityListEntities({ listId, entities })),
        initial,
      );
    const saved = (...collections: Array<{ id: string; name: string }>) => ({
      isSaved: collections.length > 0,
      collections,
    });

    it("updates the entity in every list that holds it and leaves the rest", () => {
      const s0 = withLists({
        feed: [makeEntity("e1"), makeEntity("e2")],
        space: [{ ...makeEntity("e1"), title: "old" } as Entity],
        other: [makeEntity("e3")],
      });
      const s = reducer(
        s0,
        updateEntityInLists({ entityId: "e1", changes: { title: "new" } }),
      );
      expect(s.lists.feed.entities[0].title).toBe("new");
      expect(s.lists.space.entities[0].title).toBe("new");
      expect(s.lists.feed.entities[1]).toBe(s0.lists.feed.entities[1]);
      expect(s.lists.other).toBe(s0.lists.other);
    });

    it("changes nothing when no list holds the entity", () => {
      const s0 = withLists({ feed: [makeEntity("e1")] });
      expect(reducer(s0, updateEntityInLists({ entityId: "e9", changes: { title: "x" } }))).toEqual(s0);
      expect(reducer(initial, updateEntityInLists({ entityId: "e9", changes: { title: "x" } }))).toEqual(initial);
    });

    it("keeps a copy that already holds every value as the same object", () => {
      const s0 = withLists({ feed: [{ ...makeEntity("e1"), commentsCount: 3 } as Entity] });
      const s = reducer(s0, updateEntityInLists({ entityId: "e1", changes: { commentsCount: 3 } }));
      expect(s.lists.feed.entities[0]).toBe(s0.lists.feed.entities[0]);
    });

    it("moves `commentsCount` by `commentsCountDelta` in each copy, never below 0", () => {
      let s = withLists({
        feed: [{ ...makeEntity("e1"), commentsCount: 3 } as Entity],
        other: [{ ...makeEntity("e1"), commentsCount: 0 } as Entity],
      });
      s = reducer(s, updateEntityInLists({ entityId: "e1", commentsCountDelta: 1 }));
      expect(s.lists.feed.entities[0].commentsCount).toBe(4);
      expect(s.lists.other.entities[0].commentsCount).toBe(1);
      s = reducer(s, updateEntityInLists({ entityId: "e1", commentsCountDelta: -2 }));
      expect(s.lists.feed.entities[0].commentsCount).toBe(2);
      expect(s.lists.other.entities[0].commentsCount).toBe(0);
    });

    it("keeps a copy whose saved state wouldn't change as the same object", () => {
      const s0 = withLists({
        feed: [{ ...makeEntity("e1"), saved: saved({ id: "c1", name: "Reading" }) } as Entity],
        unsaved: [{ ...makeEntity("e1"), saved: saved() } as Entity],
      });
      const added = reducer(
        s0,
        updateEntityInLists({ entityId: "e1", saved: { add: { id: "c1", name: "Reading" } } }),
      );
      expect(added.lists.feed.entities[0]).toBe(s0.lists.feed.entities[0]);
      const removed = reducer(s0, updateEntityInLists({ entityId: "e1", saved: { remove: "c9" } }));
      expect(removed.lists.feed.entities[0]).toBe(s0.lists.feed.entities[0]);
      expect(removed.lists.unsaved.entities[0]).toBe(s0.lists.unsaved.entities[0]);
    });

    it("keeps the fields the changes don't carry", () => {
      const original = {
        ...makeEntity("e1"),
        title: "old",
        content: "body",
        saved: saved({ id: "c1", name: "Reading" }),
        reactionCounts: { upvote: 1 },
      } as Entity;
      const s = reducer(
        withLists({ feed: [original] }),
        updateEntityInLists({ entityId: "e1", changes: { title: "new" } }),
      );
      expect(s.lists.feed.entities[0]).toEqual({ ...original, title: "new" });
    });

    it("adds a collection to copies that have `saved`, once, at the end", () => {
      const s0 = withLists({
        withSaved: [{ ...makeEntity("e1"), saved: saved({ id: "c1", name: "Reading" }) } as Entity],
        unsaved: [{ ...makeEntity("e1"), saved: saved() } as Entity],
        noSaved: [makeEntity("e1")],
      });
      let s = reducer(
        s0,
        updateEntityInLists({ entityId: "e1", saved: { add: { id: "c2", name: "Later" } } }),
      );
      expect(s.lists.withSaved.entities[0].saved).toEqual(
        saved({ id: "c1", name: "Reading" }, { id: "c2", name: "Later" }),
      );
      expect(s.lists.unsaved.entities[0].saved).toEqual(saved({ id: "c2", name: "Later" }));
      expect(s.lists.noSaved.entities[0]).toBe(s0.lists.noSaved.entities[0]);
      expect(s.lists.noSaved.entities[0].saved).toBeUndefined();

      // Adding a collection already listed doesn't list it twice.
      s = reducer(
        s,
        updateEntityInLists({ entityId: "e1", saved: { add: { id: "c1", name: "Reading" } } }),
      );
      expect(s.lists.withSaved.entities[0].saved?.collections.map((c) => c.id)).toEqual(["c1", "c2"]);
    });

    it("removes a collection and keeps `isSaved` true only while one is left", () => {
      let s = withLists({
        feed: [
          {
            ...makeEntity("e1"),
            saved: saved({ id: "c1", name: "Reading" }, { id: "c2", name: "Later" }),
          } as Entity,
        ],
        noSaved: [makeEntity("e1")],
      });
      s = reducer(s, updateEntityInLists({ entityId: "e1", saved: { remove: "c1" } }));
      expect(s.lists.feed.entities[0].saved).toEqual(saved({ id: "c2", name: "Later" }));
      s = reducer(s, updateEntityInLists({ entityId: "e1", saved: { remove: "c2" } }));
      expect(s.lists.feed.entities[0].saved).toEqual({ isSaved: false, collections: [] });
      expect(s.lists.noSaved.entities[0].saved).toBeUndefined();
    });
  });

  describe("updateKeywordsFilters", () => {
    it("add appends unique items to the given key", () => {
      let s = reducer(
        initial,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: ["foo", "bar"] }),
      );
      s = reducer(
        s,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: "foo" }),
      );
      expect(s.lists.feed.keywordsFilters?.includes).toEqual(["foo", "bar"]);
    });

    it("add is a no-op for key 'both'", () => {
      const s = reducer(
        initial,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "both", value: "foo" }),
      );
      expect(s.lists.feed.keywordsFilters).toBeNull();
    });

    it("remove filters out items from one key, or both keys at once", () => {
      let s = reducer(
        initial,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: ["foo", "bar"] }),
      );
      s = reducer(s, updateKeywordsFilters({ listId: "feed", type: "add", key: "doesNotInclude", value: ["foo"] }));
      s = reducer(s, updateKeywordsFilters({ listId: "feed", type: "remove", key: "both", value: "foo" }));
      expect(s.lists.feed.keywordsFilters).toEqual({ includes: ["bar"], doesNotInclude: [] });
    });

    it("reset clears one key, or both keys to null when empty", () => {
      let s = reducer(
        initial,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: ["foo"] }),
      );
      s = reducer(s, updateKeywordsFilters({ listId: "feed", type: "reset", key: "both" }));
      expect(s.lists.feed.keywordsFilters).toBeNull();
    });

    it("replace overwrites a key's items wholesale; no-ops for key 'both'", () => {
      let s = reducer(
        initial,
        updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: ["foo"] }),
      );
      s = reducer(
        s,
        updateKeywordsFilters({ listId: "feed", type: "replace", key: "includes", value: ["baz"] }),
      );
      expect(s.lists.feed.keywordsFilters?.includes).toEqual(["baz"]);

      const s2 = reducer(
        s,
        updateKeywordsFilters({ listId: "feed", type: "replace", key: "both", value: ["nope"] }),
      );
      expect(s2.lists.feed.keywordsFilters?.includes).toEqual(["baz"]); // unchanged
    });

    it("resets pagination as a side effect", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(s, incrementPage("feed"));
      s = reducer(s, updateKeywordsFilters({ listId: "feed", type: "add", key: "includes", value: "foo" }));
      expect(s.lists.feed.page).toBe(1);
      expect(s.lists.feed.hasMore).toBe(true);
    });
  });

  describe("cleanupList / cleanupOldLists", () => {
    it("cleanupList removes the given list", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(s, cleanupList("feed"));
      expect(s.lists.feed).toBeUndefined();
    });

    it("cleanupOldLists removes only lists whose lastFetched exceeds the TTL", () => {
      let s = reducer(
        initial,
        setEntityListEntities({ listId: "stale", entities: [] }),
      );
      s = {
        ...s,
        lists: {
          ...s.lists,
          stale: { ...s.lists.stale, lastFetched: Date.now() - 10_000 },
        },
      };
      s = reducer(
        s,
        setEntityListEntities({ listId: "fresh", entities: [] }),
      );

      s = reducer(s, cleanupOldLists(5_000));
      expect(s.lists.stale).toBeUndefined();
      expect(s.lists.fresh).toBeDefined();
    });

    it("cleanupOldLists ignores lists that were never fetched", () => {
      const s = reducer(initial, initializeList({ listId: "feed" }));
      const result = reducer(s, cleanupOldLists(0));
      expect(result.lists.feed).toBeDefined();
    });
  });

  describe("selectors", () => {
    it("selectEntityList(Entities/Loading/HasMore) read through to the namespaced list", () => {
      const s = reducer(
        initial,
        setEntityListEntities({ listId: "feed", entities: [makeEntity("e1")] }),
      );
      const state = { sublay: { entityLists: s } } as never;
      expect(selectEntityList(state, "feed")?.entities).toHaveLength(1);
      expect(selectEntityListEntities(state, "feed")).toHaveLength(1);
      expect(selectEntityListEntities(state, "missing")).toEqual([]);
      expect(selectEntityListLoading(state, "feed")).toBe(false);
      expect(selectEntityListLoading(state, "missing")).toBe(false);
      expect(selectEntityListHasMore(state, "feed")).toBe(true);
      expect(selectEntityListHasMore(state, "missing")).toBe(false);
    });

    it("selectEntityListSort/Filters/Config return null for a missing list, else the right shape", () => {
      const missingState = { sublay: { entityLists: initial } } as never;
      expect(selectEntityListSort(missingState, "missing")).toBeNull();
      expect(selectEntityListFilters(missingState, "missing")).toBeNull();
      expect(selectEntityListConfig(missingState, "missing")).toBeNull();

      const s = reducer(
        initial,
        updateFiltersAndSortConfig({
          listId: "feed",
          filters: { userId: "user-1" },
          sort: { sortBy: "createdAt" },
          config: { sourceId: "source-1", limit: 25 },
        }),
      );
      const state = { sublay: { entityLists: s } } as never;
      expect(selectEntityListSort(state, "feed")?.sortBy).toBe("createdAt");
      expect(selectEntityListFilters(state, "feed")?.userId).toBe("user-1");
      expect(selectEntityListConfig(state, "feed")?.sourceId).toBe("source-1");
    });
  });
});

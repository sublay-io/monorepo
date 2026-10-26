import { describe, it, expect } from "vitest";

import reducer, {
  initializeList,
  updateFilters,
  setSpaceListLoading,
  setSpaceListSpaces,
  incrementPage,
  setSpaceListHasMore,
  setSpaceListError,
  addSpace,
  removeSpace,
  updateSpace,
  cleanupList,
  cleanupOldLists,
  selectSpaceList,
  selectSpaceListSpaces,
  selectSpaceListLoading,
  selectSpaceListHasMore,
  selectSpaceListFilters,
  selectSpaceListConfig,
  type SpaceListsState,
} from "./spaceListsSlice";
import type { Space } from "../../interfaces/models/Space";

const makeSpace = (overrides: Partial<Space> = {}): Space =>
  ({ id: "space-1", name: "Space One", ...overrides }) as Space;

const initial: SpaceListsState = { lists: {} };

describe("spaceListsSlice", () => {
  it("initializeList creates default state once, idempotently", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    expect(s.lists.feed).toMatchObject({ page: 1, limit: 20, sortBy: "createdAt", spaces: [] });

    s = reducer(s, setSpaceListLoading({ listId: "feed", loading: false }));
    const s2 = reducer(s, initializeList({ listId: "feed" }));
    expect(s2.lists.feed.loading).toBe(false); // not reset back to the default `true`
  });

  describe("updateFilters", () => {
    it("creates the list if missing, applies filters/config, and resets pagination", () => {
      const s = reducer(
        initial,
        updateFilters({
          listId: "feed",
          filters: { query: "foo", searchFields: "name", sortBy: "members" },
          config: { limit: 50 },
        }),
      );
      const list = s.lists.feed;
      expect(list.query).toBe("foo");
      expect(list.searchFields).toBe("name");
      expect(list.sortBy).toBe("members");
      expect(list.limit).toBe(50);
      expect(list.page).toBe(1);
      expect(list.hasMore).toBe(true);
      expect(list.error).toBeNull();
    });

    it("ignores undefined filter values but applies explicit nulls", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(s, updateFilters({ listId: "feed", filters: { query: "x" } }));
      s = reducer(s, updateFilters({ listId: "feed", filters: { query: null, searchFields: undefined } }));
      expect(s.lists.feed.query).toBeNull();
      expect(s.lists.feed.searchFields).toBeNull();
    });

    it("parentSpaceId defaults to \"none\" (top-level), and null puts it back to the default", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      expect(s.lists.feed.parentSpaceId).toBe("none");
      s = reducer(s, updateFilters({ listId: "feed", filters: { parentSpaceId: "p1" } }));
      expect(s.lists.feed.parentSpaceId).toBe("p1");
      s = reducer(s, updateFilters({ listId: "feed", filters: { parentSpaceId: undefined } }));
      expect(s.lists.feed.parentSpaceId).toBe("p1");
      s = reducer(s, updateFilters({ listId: "feed", filters: { parentSpaceId: null } }));
      expect(s.lists.feed.parentSpaceId).toBe("none");
    });

    it("resetUnspecified resets all filter fields to defaults before applying new ones", () => {
      let s = reducer(
        initial,
        updateFilters({
          listId: "feed",
          filters: { query: "foo", searchFields: "name", sortBy: "members" },
        }),
      );
      s = reducer(
        s,
        updateFilters({
          listId: "feed",
          filters: { sortBy: "alphabetical" },
          options: { resetUnspecified: true },
        }),
      );
      expect(s.lists.feed.query).toBeNull();
      expect(s.lists.feed.searchFields).toBeNull();
      expect(s.lists.feed.sortBy).toBe("alphabetical"); // new value still applied after reset
    });
  });

  it("setSpaceListLoading is a no-op for a missing list", () => {
    const s = reducer(initial, setSpaceListLoading({ listId: "missing", loading: true }));
    expect(s).toEqual(initial);
  });

  describe("setSpaceListSpaces", () => {
    it("creates the list if missing and replaces spaces by default", () => {
      const s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1" })] }),
      );
      expect(s.lists.feed.spaces.map((sp) => sp.id)).toEqual(["s1"]);
      expect(s.lists.feed.loading).toBe(false);
      expect(s.lists.feed.lastFetched).not.toBeNull();
    });

    it("appends and de-dupes by id when append is true", () => {
      let s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1" })] }),
      );
      s = reducer(
        s,
        setSpaceListSpaces({
          listId: "feed",
          spaces: [makeSpace({ id: "s1" }), makeSpace({ id: "s2" })],
          append: true,
        }),
      );
      expect(s.lists.feed.spaces.map((sp) => sp.id)).toEqual(["s1", "s2"]);
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

  it("setSpaceListHasMore and setSpaceListError set their fields (error also stops loading)", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    s = reducer(s, setSpaceListHasMore({ listId: "feed", hasMore: false }));
    expect(s.lists.feed.hasMore).toBe(false);

    s = reducer(s, setSpaceListError({ listId: "feed", error: "boom" }));
    expect(s.lists.feed.error).toBe("boom");
    expect(s.lists.feed.loading).toBe(false);
  });

  describe("addSpace / removeSpace / updateSpace", () => {
    it("addSpace inserts first by default, or last when requested; no-ops for a missing list", () => {
      let s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1" })] }),
      );
      s = reducer(s, addSpace({ listId: "feed", space: makeSpace({ id: "s0" }) }));
      expect(s.lists.feed.spaces.map((sp) => sp.id)).toEqual(["s0", "s1"]);

      s = reducer(s, addSpace({ listId: "feed", space: makeSpace({ id: "s2" }), insertPosition: "last" }));
      expect(s.lists.feed.spaces.map((sp) => sp.id)).toEqual(["s0", "s1", "s2"]);

      const unchanged = reducer(initial, addSpace({ listId: "missing", space: makeSpace() }));
      expect(unchanged).toEqual(initial);
    });

    it("removeSpace filters the matching id; no-ops for a missing list", () => {
      let s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1" }), makeSpace({ id: "s2" })] }),
      );
      s = reducer(s, removeSpace({ listId: "feed", spaceId: "s1" }));
      expect(s.lists.feed.spaces.map((sp) => sp.id)).toEqual(["s2"]);

      const unchanged = reducer(initial, removeSpace({ listId: "missing", spaceId: "s1" }));
      expect(unchanged).toEqual(initial);
    });

    it("updateSpace merges updates into the matching space, or no-ops if not found", () => {
      let s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1", name: "Old" })] }),
      );
      s = reducer(s, updateSpace({ listId: "feed", spaceId: "s1", updates: { name: "New" } }));
      expect(s.lists.feed.spaces[0].name).toBe("New");

      const s2 = reducer(s, updateSpace({ listId: "feed", spaceId: "missing", updates: { name: "X" } }));
      expect(s2.lists.feed.spaces[0].name).toBe("New");

      const unchanged = reducer(initial, updateSpace({ listId: "missing", spaceId: "s1", updates: {} }));
      expect(unchanged).toEqual(initial);
    });
  });

  describe("cleanupList / cleanupOldLists", () => {
    it("cleanupList removes the given list", () => {
      let s = reducer(initial, initializeList({ listId: "feed" }));
      s = reducer(s, cleanupList("feed"));
      expect(s.lists.feed).toBeUndefined();
    });

    it("cleanupOldLists removes only lists whose lastFetched exceeds the TTL", () => {
      let s = reducer(initial, setSpaceListSpaces({ listId: "stale", spaces: [] }));
      s = {
        ...s,
        lists: { ...s.lists, stale: { ...s.lists.stale, lastFetched: Date.now() - 10_000 } },
      };
      s = reducer(s, setSpaceListSpaces({ listId: "fresh", spaces: [] }));

      s = reducer(s, cleanupOldLists(5_000));
      expect(s.lists.stale).toBeUndefined();
      expect(s.lists.fresh).toBeDefined();
    });
  });

  describe("selectors", () => {
    it("selectSpaceList(Spaces/Loading/HasMore) read through to the namespaced list", () => {
      const s = reducer(
        initial,
        setSpaceListSpaces({ listId: "feed", spaces: [makeSpace({ id: "s1" })] }),
      );
      const state = { sublay: { spaceLists: s } } as never;
      expect(selectSpaceList(state, "feed")?.spaces).toHaveLength(1);
      expect(selectSpaceListSpaces(state, "feed")).toHaveLength(1);
      expect(selectSpaceListSpaces(state, "missing")).toEqual([]);
      expect(selectSpaceListLoading(state, "feed")).toBe(false);
      expect(selectSpaceListLoading(state, "missing")).toBe(false);
      expect(selectSpaceListHasMore(state, "feed")).toBe(true);
      expect(selectSpaceListHasMore(state, "missing")).toBe(false);
    });

    it("selectSpaceListFilters/Config return null for a missing list, else the right shape", () => {
      const missingState = { sublay: { spaceLists: initial } } as never;
      expect(selectSpaceListFilters(missingState, "missing")).toBeNull();
      expect(selectSpaceListConfig(missingState, "missing")).toBeNull();

      const s = reducer(
        initial,
        updateFilters({ listId: "feed", filters: { query: "foo" }, config: { limit: 50 } }),
      );
      const state = { sublay: { spaceLists: s } } as never;
      expect(selectSpaceListFilters(state, "feed")?.query).toBe("foo");
      expect(selectSpaceListConfig(state, "feed")?.limit).toBe(50);
    });
  });
});

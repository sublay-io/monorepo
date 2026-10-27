import { describe, it, expect } from "vitest";

import reducer, {
  initializeList,
  updateFilters,
  setWorkspaceListLoading,
  setWorkspaceListWorkspaces,
  incrementPage,
  setWorkspaceListHasMore,
  setWorkspaceListError,
  addWorkspace,
  removeWorkspace,
  updateWorkspace,
  cleanupList,
  cleanupOldLists,
  normalizeWorkspaceInclude,
  selectWorkspaceList,
  selectWorkspaceListWorkspaces,
  selectWorkspaceListLoading,
  selectWorkspaceListHasMore,
  selectWorkspaceListFilters,
  selectWorkspaceListConfig,
  type WorkspaceListsState,
} from "./workspaceListsSlice";
import type { Workspace } from "../../interfaces/models/Workspace";

const makeWorkspace = (overrides: Partial<Workspace> = {}): Workspace =>
  ({ id: "w-1", name: "Workspace One", parentWorkspaceId: null, ...overrides }) as Workspace;

const initial: WorkspaceListsState = { lists: {} };

const ids = (s: WorkspaceListsState, listId = "feed") =>
  s.lists[listId].workspaces.map((w) => w.id);

describe("workspaceListsSlice", () => {
  it("initializeList creates default state once, idempotently", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    expect(s.lists.feed).toMatchObject({
      page: 1,
      limit: 20,
      workspaces: [],
      relation: "reachable",
      parentWorkspaceId: "any",
      sortDir: "desc",
      include: null,
    });

    s = reducer(s, setWorkspaceListLoading({ listId: "feed", loading: false }));
    const s2 = reducer(s, initializeList({ listId: "feed" }));
    expect(s2.lists.feed.loading).toBe(false);
  });

  describe("updateFilters", () => {
    it("creates the list if missing, applies filters/config, and resets pagination", () => {
      const s = reducer(
        initial,
        updateFilters({
          listId: "feed",
          filters: { relation: "direct", parentWorkspaceId: "none", sortDir: "asc", include: "memberCount" },
          config: { limit: 50 },
        }),
      );
      const list = s.lists.feed;
      expect(list.relation).toBe("direct");
      expect(list.parentWorkspaceId).toBe("none");
      expect(list.sortDir).toBe("asc");
      expect(list.include).toEqual(["memberCount"]);
      expect(list.limit).toBe(50);
      expect(list.page).toBe(1);
      expect(list.hasMore).toBe(true);
      expect(list.error).toBeNull();
    });

    it("undefined keeps a filter; null puts it back to its default", () => {
      let s = reducer(
        initial,
        updateFilters({
          listId: "feed",
          filters: { relation: "direct", parentWorkspaceId: "p1", sortDir: "asc", include: ["memberCount"] },
        }),
      );
      s = reducer(
        s,
        updateFilters({
          listId: "feed",
          filters: { relation: undefined, parentWorkspaceId: undefined, sortDir: undefined, include: undefined },
        }),
      );
      expect(s.lists.feed).toMatchObject({
        relation: "direct",
        parentWorkspaceId: "p1",
        sortDir: "asc",
        include: ["memberCount"],
      });

      s = reducer(
        s,
        updateFilters({
          listId: "feed",
          filters: { relation: null, parentWorkspaceId: null, sortDir: null, include: null },
        }),
      );
      expect(s.lists.feed).toMatchObject({
        relation: "reachable",
        parentWorkspaceId: "any",
        sortDir: "desc",
        include: null,
      });
    });

    it("resetUnspecified resets every filter to its default before applying new ones", () => {
      let s = reducer(
        initial,
        updateFilters({
          listId: "feed",
          filters: { relation: "direct", parentWorkspaceId: "none", include: "memberCount" },
        }),
      );
      s = reducer(
        s,
        updateFilters({ listId: "feed", filters: { sortDir: "asc" }, options: { resetUnspecified: true } }),
      );
      expect(s.lists.feed).toMatchObject({
        relation: "reachable",
        parentWorkspaceId: "any",
        sortDir: "asc",
        include: null,
      });
    });
  });

  it("normalizeWorkspaceInclude accepts an array or a comma-separated string", () => {
    expect(normalizeWorkspaceInclude(undefined)).toBeNull();
    expect(normalizeWorkspaceInclude(null)).toBeNull();
    expect(normalizeWorkspaceInclude("")).toBeNull();
    expect(normalizeWorkspaceInclude([])).toBeNull();
    expect(normalizeWorkspaceInclude("memberCount")).toEqual(["memberCount"]);
    expect(normalizeWorkspaceInclude(["memberCount"])).toEqual(["memberCount"]);
  });

  describe("setWorkspaceListWorkspaces", () => {
    it("creates the list if missing and replaces by default", () => {
      const s = reducer(
        initial,
        setWorkspaceListWorkspaces({ listId: "feed", workspaces: [makeWorkspace({ id: "w1" })] }),
      );
      expect(ids(s)).toEqual(["w1"]);
      expect(s.lists.feed.loading).toBe(false);
      expect(s.lists.feed.lastFetched).not.toBeNull();
    });

    it("appends and de-dupes by id when append is true", () => {
      let s = reducer(
        initial,
        setWorkspaceListWorkspaces({ listId: "feed", workspaces: [makeWorkspace({ id: "w1" })] }),
      );
      s = reducer(
        s,
        setWorkspaceListWorkspaces({
          listId: "feed",
          workspaces: [makeWorkspace({ id: "w1" }), makeWorkspace({ id: "w2" })],
          append: true,
        }),
      );
      expect(ids(s)).toEqual(["w1", "w2"]);
    });
  });

  it("incrementPage, setWorkspaceListHasMore and setWorkspaceListError update their fields; no-ops for a missing list", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    s = reducer(s, incrementPage("feed"));
    expect(s.lists.feed.page).toBe(2);
    s = reducer(s, setWorkspaceListHasMore({ listId: "feed", hasMore: false }));
    expect(s.lists.feed.hasMore).toBe(false);
    s = reducer(s, setWorkspaceListError({ listId: "feed", error: "boom" }));
    expect(s.lists.feed.error).toBe("boom");
    expect(s.lists.feed.loading).toBe(false);

    expect(reducer(initial, incrementPage("missing"))).toEqual(initial);
    expect(reducer(initial, setWorkspaceListLoading({ listId: "missing", loading: true }))).toEqual(initial);
  });

  describe("addWorkspace", () => {
    const listWith = (filters: Parameters<typeof updateFilters>[0]["filters"], hasMore: boolean) => {
      let s = reducer(initial, updateFilters({ listId: "feed", filters }));
      s = reducer(s, setWorkspaceListWorkspaces({ listId: "feed", workspaces: [makeWorkspace({ id: "w1" })] }));
      return reducer(s, setWorkspaceListHasMore({ listId: "feed", hasMore }));
    };

    it("puts the new workspace first under desc (the default), even with more pages to load", () => {
      const s = reducer(listWith({}, true), addWorkspace({ listId: "feed", workspace: makeWorkspace({ id: "new" }) }));
      expect(ids(s)).toEqual(["new", "w1"]);
    });

    it("puts it last under asc once every page is loaded", () => {
      const s = reducer(
        listWith({ sortDir: "asc" }, false),
        addWorkspace({ listId: "feed", workspace: makeWorkspace({ id: "new" }) }),
      );
      expect(ids(s)).toEqual(["w1", "new"]);
    });

    it("leaves it out under asc while pages remain: it belongs on a page not loaded yet", () => {
      const s = reducer(
        listWith({ sortDir: "asc" }, true),
        addWorkspace({ listId: "feed", workspace: makeWorkspace({ id: "new" }) }),
      );
      expect(ids(s)).toEqual(["w1"]);
    });

    it("follows the parent filter", () => {
      const top = makeWorkspace({ id: "top", parentWorkspaceId: null });
      const child = makeWorkspace({ id: "child", parentWorkspaceId: "p1" });

      let s = listWith({ parentWorkspaceId: "none" }, false);
      s = reducer(s, addWorkspace({ listId: "feed", workspace: child }));
      s = reducer(s, addWorkspace({ listId: "feed", workspace: top }));
      expect(ids(s)).toEqual(["top", "w1"]);

      s = listWith({ parentWorkspaceId: "p1" }, false);
      s = reducer(s, addWorkspace({ listId: "feed", workspace: top }));
      s = reducer(s, addWorkspace({ listId: "feed", workspace: child }));
      expect(ids(s)).toEqual(["child", "w1"]);

      s = listWith({ parentWorkspaceId: "any" }, false);
      s = reducer(s, addWorkspace({ listId: "feed", workspace: top }));
      s = reducer(s, addWorkspace({ listId: "feed", workspace: child }));
      expect(ids(s)).toEqual(["child", "top", "w1"]);
    });

    it("skips a workspace already in the list, and a missing list", () => {
      const s = reducer(listWith({}, false), addWorkspace({ listId: "feed", workspace: makeWorkspace({ id: "w1" }) }));
      expect(ids(s)).toEqual(["w1"]);
      expect(reducer(initial, addWorkspace({ listId: "missing", workspace: makeWorkspace() }))).toEqual(initial);
    });
  });

  it("removeWorkspace and updateWorkspace act on the matching id; no-ops for a missing list", () => {
    let s = reducer(
      initial,
      setWorkspaceListWorkspaces({
        listId: "feed",
        workspaces: [makeWorkspace({ id: "w1", name: "Old" }), makeWorkspace({ id: "w2" })],
      }),
    );
    s = reducer(s, updateWorkspace({ listId: "feed", workspaceId: "w1", updates: { name: "New" } }));
    expect(s.lists.feed.workspaces[0].name).toBe("New");
    s = reducer(s, removeWorkspace({ listId: "feed", workspaceId: "w1" }));
    expect(ids(s)).toEqual(["w2"]);

    expect(reducer(initial, removeWorkspace({ listId: "missing", workspaceId: "w1" }))).toEqual(initial);
    expect(reducer(initial, updateWorkspace({ listId: "missing", workspaceId: "w1", updates: {} }))).toEqual(initial);
  });

  it("cleanupList removes a list; cleanupOldLists removes only stale ones", () => {
    let s = reducer(initial, initializeList({ listId: "feed" }));
    s = reducer(s, cleanupList("feed"));
    expect(s.lists.feed).toBeUndefined();

    s = reducer(initial, setWorkspaceListWorkspaces({ listId: "stale", workspaces: [] }));
    s = { ...s, lists: { ...s.lists, stale: { ...s.lists.stale, lastFetched: Date.now() - 10_000 } } };
    s = reducer(s, setWorkspaceListWorkspaces({ listId: "fresh", workspaces: [] }));
    s = reducer(s, cleanupOldLists(5_000));
    expect(s.lists.stale).toBeUndefined();
    expect(s.lists.fresh).toBeDefined();
  });

  describe("selectors", () => {
    it("read through to the namespaced list", () => {
      const s = reducer(
        initial,
        setWorkspaceListWorkspaces({ listId: "feed", workspaces: [makeWorkspace({ id: "w1" })] }),
      );
      const state = { sublay: { workspaceLists: s } } as never;
      expect(selectWorkspaceList(state, "feed")?.workspaces).toHaveLength(1);
      expect(selectWorkspaceListWorkspaces(state, "feed")).toHaveLength(1);
      expect(selectWorkspaceListWorkspaces(state, "missing")).toEqual([]);
      expect(selectWorkspaceListLoading(state, "feed")).toBe(false);
      expect(selectWorkspaceListHasMore(state, "feed")).toBe(true);
      expect(selectWorkspaceListHasMore(state, "missing")).toBe(false);
    });

    it("filters/config return null for a missing list, else the right shape", () => {
      const missingState = { sublay: { workspaceLists: initial } } as never;
      expect(selectWorkspaceListFilters(missingState, "missing")).toBeNull();
      expect(selectWorkspaceListConfig(missingState, "missing")).toBeNull();

      const s = reducer(
        initial,
        updateFilters({ listId: "feed", filters: { relation: "direct" }, config: { limit: 50 } }),
      );
      const state = { sublay: { workspaceLists: s } } as never;
      expect(selectWorkspaceListFilters(state, "feed")).toEqual({
        relation: "direct",
        parentWorkspaceId: "any",
        sortDir: "desc",
        include: null,
      });
      expect(selectWorkspaceListConfig(state, "feed")?.limit).toBe(50);
    });
  });
});

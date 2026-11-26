import { describe, it, expect } from "vitest";

import { makeSublayStore } from "../test-utils";
import { resetAccountScopedState } from "./actions";
import { setUnreadSummary } from "./slices/chatSlice";
import { initializeList as initializeEntityList } from "./slices/entityListsSlice";
import { initializeList as initializeSpaceList } from "./slices/spaceListsSlice";
import { initializeList as initializeWorkspaceList } from "./slices/workspaceListsSlice";
import { setCurrentCollection, resetCollections } from "./slices/collectionsSlice";
import { setUnreadCount } from "./slices/appNotificationsSlice";
import { initializeTableView } from "./slices/tablesSlice";
import { fileLinksRefreshed, fileLinksUnavailable } from "./slices/fileLinksSlice";

/**
 * Every hand-rolled feature slice must return to its initial state when the
 * active account changes.
 *
 * Asserted ONE SLICE PER TEST on purpose. An aggregate "the whole sublay state
 * matches initial" assertion reports a single anonymous failure; these name the
 * slice that forgot to subscribe, which is the realistic future regression —
 * someone adds a slice and never wires the `extraReducers` case.
 */
describe("resetAccountScopedState", () => {
  it("resets the chat slice", () => {
    const store = makeSublayStore();
    store.dispatch(
      setUnreadSummary({ totalUnread: 12, unreadConversationCount: 7 })
    );
    expect(store.getState().sublay.chat.unreadConversationCount).toBe(7);

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.chat.unreadConversationCount).toBeNull();
    expect(store.getState().sublay.chat.totalUnreadCount).toBeNull();
  });

  it("resets the entityLists slice", () => {
    const store = makeSublayStore();
    store.dispatch(initializeEntityList({ listId: "feed" }));
    expect(store.getState().sublay.entityLists.lists.feed).toBeDefined();

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.entityLists.lists).toEqual({});
  });

  it("resets the spaceLists slice", () => {
    const store = makeSublayStore();
    store.dispatch(initializeSpaceList({ listId: "spaces" }));
    expect(store.getState().sublay.spaceLists.lists.spaces).toBeDefined();

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.spaceLists.lists).toEqual({});
  });

  it("resets the workspaceLists slice", () => {
    const store = makeSublayStore();
    store.dispatch(initializeWorkspaceList({ listId: "workspaces" }));
    expect(store.getState().sublay.workspaceLists.lists.workspaces).toBeDefined();

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.workspaceLists.lists).toEqual({});
  });

  it("resets the collections slice", () => {
    const store = makeSublayStore();
    store.dispatch(
      setCurrentCollection({ id: "col-1", name: "Saved" } as never)
    );
    expect(
      store.getState().sublay.collections.currentCollectionId
    ).not.toBeNull();

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.collections.currentCollectionId).toBeNull();
    expect(store.getState().sublay.collections.collectionsById).toEqual({});
  });

  it("resets the appNotifications slice", () => {
    const store = makeSublayStore();
    store.dispatch(setUnreadCount(9));
    expect(store.getState().sublay.appNotifications.unreadCount).toBe(9);

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.appNotifications.unreadCount).toBe(0);
    expect(store.getState().sublay.appNotifications.notifications).toEqual([]);
  });

  it("resets the tables slice", () => {
    const store = makeSublayStore();
    store.dispatch(initializeTableView({ tableName: "orders" }));
    expect(store.getState().sublay.tables.views.orders).toBeDefined();

    store.dispatch(resetAccountScopedState());

    expect(store.getState().sublay.tables.views).toEqual({});
  });

  it("leaves the pre-existing per-slice reset action working unchanged", () => {
    // Publicly reachable through an exported hook (`useCollectionsActions`),
    // so the shared action must not have replaced it.
    const store = makeSublayStore();

    store.dispatch(setCurrentCollection({ id: "col-1", name: "Saved" } as never));
    store.dispatch(resetCollections());
    expect(store.getState().sublay.collections.currentCollectionId).toBeNull();
  });

  it("resets the fileLinks slice, and moves on to a new generation", () => {
    const store = makeSublayStore();
    store.dispatch(fileLinksRefreshed([{ id: "f1" } as any]));
    store.dispatch(fileLinksUnavailable([{ id: "f2", link: null }]));
    const before = store.getState().sublay.fileLinks.generation;

    store.dispatch(resetAccountScopedState());

    const state = store.getState().sublay.fileLinks;
    expect(state.byId).toEqual({});
    expect(state.unavailable).toEqual({});
    expect(state.generation).toBe(before + 1);
  });
});

import React from "react";
import { describe, it, expect, afterEach, vi } from "vitest";
import { act, renderHook, waitFor } from "@testing-library/react";
import { Provider } from "react-redux";

import { makeAuthUser, makeSublayStore, resetAxiosMocks } from "../../test-utils";
import { setInitialized, setTokens, setUser } from "../../store/slices/authSlice";
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
import { SublayContext, type SublayContextValues } from "../../context/sublay-context";
import { EntityProvider } from "../../context/entity-context";
import { axiosPrivate } from "../../config/axios";
import { useSublaySelector } from "../../store/hooks";
import useCommentSectionData from "./useCommentSectionData";
import useEntity from "../entities/useEntity";
import useAddReaction from "../reactions/useAddReaction";
import { makeComment, makeEntity } from "./testHelpers";
import type { Entity } from "../../interfaces/models/Entity";

afterEach(() => resetAxiosMocks());

const NEW = "33333333-3333-4333-8333-333333333333";

const ok = (data: unknown, status = 200) =>
  Promise.resolve({ data, status, statusText: "OK", headers: {}, config: {} } as any);
const fail = () =>
  Promise.reject(Object.assign(new Error("boom"), { response: { status: 500, data: {} } }));

const listEntity = makeEntity({ id: "entity-1", commentsCount: 5 });

/** Comment creates succeed or fail as asked; entity reactions answer with an upvote. */
function mockRequests(createSucceeds: boolean) {
  vi.spyOn(axiosPrivate, "get").mockImplementation(() =>
    ok({ data: [], pagination: { nextCursor: null, hasMore: false } }),
  );
  vi.spyOn(axiosPrivate, "post").mockImplementation((url: string) => {
    if (url.endsWith("/entities/entity-1/reactions")) {
      return ok({
        ...listEntity,
        userReaction: "upvote",
        reactionCounts: { ...listEntity.reactionCounts, upvote: 1 },
      });
    }
    return createSucceeds ? ok(makeComment({ id: NEW, entityId: "entity-1" }), 201) : fail();
  });
}

function makeStore() {
  const store = makeSublayStore();
  store.dispatch(setTokens({ accessToken: null, refreshToken: null }));
  store.dispatch(setUser(makeAuthUser({ id: "user-1", username: "alice" })));
  store.dispatch(setInitialized(true));
  store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity] }));
  return store;
}

const useListCopy = () =>
  useSublaySelector((state) => state.sublay.entityLists.lists.feed?.entities[0]);

/** A feed item: an `EntityProvider` given the list's copy of the entity. */
function renderListFedProvider() {
  const store = makeStore();
  function FeedItem({ children }: { children: React.ReactNode }) {
    const entity = useListCopy();
    if (!entity) return null;
    return <EntityProvider entity={entity}>{children}</EntityProvider>;
  }
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          <FeedItem>{children}</FeedItem>
        </SublayContext.Provider>
      </Provider>
    );
  }
  return renderHook(
    () => ({
      section: useCommentSectionData({}),
      provided: useEntity().entity as Entity | null | undefined,
      listCopy: useListCopy(),
      addReaction: useAddReaction(),
    }),
    { wrapper: Wrapper },
  );
}

/** A section given the list's copy as its `entity` prop, no `EntityProvider`. */
function renderListFedProp() {
  const store = makeStore();
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <Provider store={store}>
        <SublayContext.Provider
          value={{ projectId: "test-project", project: null } as SublayContextValues}
        >
          {children}
        </SublayContext.Provider>
      </Provider>
    );
  }
  return renderHook(
    () => {
      const listCopy = useListCopy();
      return {
        section: useCommentSectionData({ entity: listCopy }),
        listCopy,
        addReaction: useAddReaction(),
      };
    },
    { wrapper: Wrapper },
  );
}

describe("useCommentSectionData — an entity from a loaded list", () => {
  for (const outcome of ["success", "failure"] as const) {
    it(`in a list-fed EntityProvider, a comment ${outcome} and then a reaction keep the count`, async () => {
      mockRequests(outcome === "success");
      const { result } = renderListFedProvider();
      await waitFor(() => expect(result.current.section.loading).toBe(false));

      await act(async () => {
        await result.current.section.createComment({ content: "hello" });
      });
      const expected = outcome === "success" ? 6 : 5;
      await waitFor(() => expect(result.current.listCopy?.commentsCount).toBe(expected));
      expect(result.current.provided?.commentsCount).toBe(expected);

      await act(async () => {
        await result.current.addReaction({
          targetType: "entity",
          targetId: "entity-1",
          reactionType: "upvote",
        });
      });
      await waitFor(() => expect(result.current.provided?.userReaction).toBe("upvote"));
      expect(result.current.provided?.commentsCount).toBe(expected);
      expect(result.current.section.entity?.commentsCount).toBe(expected);
      expect(result.current.listCopy?.commentsCount).toBe(expected);
    });

    it(`with the list's copy as the entity prop, a comment ${outcome} and then a reaction keep the count`, async () => {
      mockRequests(outcome === "success");
      const { result } = renderListFedProp();
      await waitFor(() => expect(result.current.section.loading).toBe(false));

      await act(async () => {
        await result.current.section.createComment({ content: "hello" });
      });
      const expected = outcome === "success" ? 6 : 5;
      await waitFor(() => expect(result.current.section.entity?.commentsCount).toBe(expected));
      expect(result.current.listCopy?.commentsCount).toBe(expected);

      await act(async () => {
        await result.current.addReaction({
          targetType: "entity",
          targetId: "entity-1",
          reactionType: "upvote",
        });
      });
      await waitFor(() => expect(result.current.listCopy?.userReaction).toBe("upvote"));
      expect(result.current.section.entity?.commentsCount).toBe(expected);
      expect(result.current.listCopy?.commentsCount).toBe(expected);
    });
  }
});

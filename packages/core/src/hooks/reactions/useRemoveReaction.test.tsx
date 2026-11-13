import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity, makeComment, makeUser } from "../../test-utils";
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
import useRemoveReaction from "./useRemoveReaction";

afterEach(() => {
  resetAxiosMocks();
});

describe("useRemoveReaction", () => {
  it("removes a reaction from an entity", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveReaction());

    const entity = makeEntity({ userReaction: null });
    axiosPrivate.mockResponse("delete", entity);

    let returned;
    await act(async () => {
      returned = await result.current({ targetType: "entity", targetId: "entity-1" });
    });

    expect(returned).toEqual(entity);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/entities/entity-1/reactions");
  });

  it("removes a reaction from a comment", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveReaction());

    const comment = makeComment({ userReaction: null });
    axiosPrivate.mockResponse("delete", comment);

    await act(async () => {
      await result.current({ targetType: "comment", targetId: "comment-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/comments/comment-1/reactions");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveReaction());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ targetType: "entity", targetId: "entity-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no target ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveReaction());

    await expect(
      result.current({ targetType: "entity", targetId: "" }),
    ).rejects.toThrow("No target ID provided");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
  describe("loaded entity lists", () => {
    const counts = (upvote: number) => ({ ...makeEntity().reactionCounts, upvote });
    const listEntity = () =>
      makeEntity({
        userReaction: "upvote",
        reactionCounts: counts(2),
        user: makeUser({ id: "author" }),
        saved: { isSaved: true, collections: [{ id: "c1", name: "Reading" }] },
      });

    it("shows the reaction and the counts in every list holding the entity", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useRemoveReaction());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      store.dispatch(
        setEntityListEntities({
          listId: "space",
          entities: [makeEntity({ id: "entity-2" }), listEntity()],
        }),
      );
      axiosPrivate.mockResponse(
        "delete",
        makeEntity({ userReaction: null, reactionCounts: counts(1), user: null }),
      );

      await act(async () => {
        await result.current({ targetType: "entity", targetId: "entity-1" });
      });

      const lists = store.getState().sublay.entityLists.lists;
      for (const entity of [lists.feed.entities[0], lists.space.entities[1]]) {
        expect(entity).toEqual({
          ...listEntity(),
          userReaction: null,
          reactionCounts: counts(1),
        });
      }
      expect(lists.space.entities[0]).toEqual(makeEntity({ id: "entity-2" }));
    });

    it("leaves the lists as they are for a comment reaction or a failed request", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useRemoveReaction());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      const before = store.getState().sublay.entityLists;

      axiosPrivate.mockResponse("delete", makeComment({ id: "entity-1", userReaction: null }));
      await act(async () => {
        await result.current({ targetType: "comment", targetId: "entity-1" });
      });
      expect(store.getState().sublay.entityLists).toBe(before);

      axiosPrivate.mockError("delete", 500, { message: "Internal error" });
      await expect(result.current({ targetType: "entity", targetId: "entity-1" })).rejects.toMatchObject({
        response: { status: 500 },
      });
      expect(store.getState().sublay.entityLists).toBe(before);
    });
  });
});

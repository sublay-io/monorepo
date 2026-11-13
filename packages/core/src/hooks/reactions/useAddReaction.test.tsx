import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity, makeComment, makeUser } from "../../test-utils";
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
import useAddReaction from "./useAddReaction";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAddReaction", () => {
  it("adds a reaction to an entity", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddReaction());

    const entity = makeEntity({ userReaction: "upvote" });
    axiosPrivate.mockResponse("post", entity);

    let returned;
    await act(async () => {
      returned = await result.current({
        targetType: "entity",
        targetId: "entity-1",
        reactionType: "upvote",
      });
    });

    expect(returned).toEqual(entity);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/entities/entity-1/reactions");
    expect(call.body).toEqual({ reactionType: "upvote" });
  });

  it("adds a reaction to a comment", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddReaction());

    const comment = makeComment({ userReaction: "love" });
    axiosPrivate.mockResponse("post", comment);

    await act(async () => {
      await result.current({
        targetType: "comment",
        targetId: "comment-1",
        reactionType: "love",
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/comments/comment-1/reactions");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddReaction());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ targetType: "entity", targetId: "entity-1", reactionType: "upvote" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no target ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddReaction());

    await expect(
      result.current({ targetType: "entity", targetId: "", reactionType: "upvote" }),
    ).rejects.toThrow("No target ID provided");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when no reaction type is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddReaction());

    await expect(
      result.current({ targetType: "entity", targetId: "entity-1", reactionType: "" as any }),
    ).rejects.toThrow("No reaction type provided");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
  describe("loaded entity lists", () => {
    const counts = (upvote: number) => ({ ...makeEntity().reactionCounts, upvote });
    const listEntity = () =>
      makeEntity({
        userReaction: null,
        reactionCounts: counts(1),
        user: makeUser({ id: "author" }),
        saved: { isSaved: true, collections: [{ id: "c1", name: "Reading" }] },
      });

    it("shows the reaction and the counts in every list holding the entity", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useAddReaction());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      store.dispatch(
        setEntityListEntities({
          listId: "space",
          entities: [makeEntity({ id: "entity-2" }), listEntity()],
        }),
      );
      axiosPrivate.mockResponse(
        "post",
        makeEntity({ userReaction: "upvote", reactionCounts: counts(2), user: null }),
      );

      await act(async () => {
        await result.current({ targetType: "entity", targetId: "entity-1", reactionType: "upvote" });
      });

      const lists = store.getState().sublay.entityLists.lists;
      for (const entity of [lists.feed.entities[0], lists.space.entities[1]]) {
        expect(entity).toEqual({
          ...listEntity(),
          userReaction: "upvote",
          reactionCounts: counts(2),
        });
      }
      expect(lists.space.entities[0]).toEqual(makeEntity({ id: "entity-2" }));
    });

    it("leaves the lists as they are for a comment reaction or a failed request", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useAddReaction());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      const before = store.getState().sublay.entityLists;

      axiosPrivate.mockResponse("post", makeComment({ id: "entity-1", userReaction: "upvote" }));
      await act(async () => {
        await result.current({ targetType: "comment", targetId: "entity-1", reactionType: "upvote" });
      });
      expect(store.getState().sublay.entityLists).toBe(before);

      axiosPrivate.mockError("post", 500, { message: "Internal error" });
      await expect(result.current({ targetType: "entity", targetId: "entity-1", reactionType: "upvote" })).rejects.toMatchObject({
        response: { status: 500 },
      });
      expect(store.getState().sublay.entityLists).toBe(before);
    });
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity, makeUser, makeSpace } from "../../test-utils";
import { setEntityListEntities } from "../../store/slices/entityListsSlice";
import useUpdateEntity, { applyEntityUpdate } from "./useUpdateEntity";

afterEach(() => {
  resetAxiosMocks();
});

describe("useUpdateEntity", () => {
  it("updates the entity and returns the server response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());

    const updated = makeEntity({ title: "New title" });
    axiosPrivate.mockResponse("patch", updated);

    let returned: typeof updated | undefined;
    await act(async () => {
      returned = await result.current({
        entityId: "entity-1",
        update: { title: "New title" },
      });
    });

    expect(returned).toEqual(updated);

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/entities/entity-1");
    expect(call.body).toMatchObject({ title: "New title" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ entityId: "entity-1", update: { title: "New title" } }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity(), {
      projectId: "",
    });

    await expect(
      result.current({ entityId: "entity-1", update: { title: "New title" } }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
  describe("loaded entity lists", () => {
    const listEntity = () =>
      makeEntity({
        title: "Old title",
        userReaction: "upvote",
        user: makeUser({ id: "author", avatarFileId: "file-1" }),
        space: makeSpace({ id: "space-1" }),
        saved: { isSaved: true, collections: [{ id: "c1", name: "Reading" }] },
      });

    it("shows the edit in every list holding the entity, keeping what the response lacks", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useUpdateEntity());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      store.dispatch(
        setEntityListEntities({
          listId: "other",
          entities: [makeEntity({ id: "entity-2" }), listEntity()],
        }),
      );
      // As the server answers an edit: no `saved` / `space`, a null
      // `userReaction`, and the author without files.
      axiosPrivate.mockResponse(
        "patch",
        makeEntity({
          title: "New title",
          updatedAt: "2024-02-01T00:00:00.000Z",
          userReaction: null,
          user: makeUser({ id: "author" }),
        }),
      );

      await act(async () => {
        await result.current({ entityId: "entity-1", update: { title: "New title" } });
      });

      const lists = store.getState().sublay.entityLists.lists;
      for (const entity of [lists.feed.entities[0], lists.other.entities[1]]) {
        expect(entity).toEqual({
          ...listEntity(),
          title: "New title",
          updatedAt: "2024-02-01T00:00:00.000Z",
        });
      }
      expect(lists.other.entities[0]).toEqual(makeEntity({ id: "entity-2" }));
    });

    it("leaves the lists as they are when the edit fails", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useUpdateEntity());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      const before = store.getState().sublay.entityLists;

      axiosPrivate.mockError("patch", 500, { message: "Internal error" });
      await expect(
        result.current({ entityId: "entity-1", update: { title: "New title" } }),
      ).rejects.toMatchObject({ response: { status: 500 } });
      expect(store.getState().sublay.entityLists).toBe(before);
    });
  });
});

describe("applyEntityUpdate", () => {
  const base = { id: "e1", title: "Old", userReaction: "upvote", saved: { isSaved: true, collections: [] } } as any;
  const edit = { id: "e1", title: "New", userReaction: null, user: { id: "u1" } } as any;

  it("applies an edit of the same entity, keeping userReaction, user and fields the response lacks", () => {
    expect(applyEntityUpdate(base, edit)).toEqual({ ...base, title: "New" });
  });

  it("keeps a different entity as it is", () => {
    const other = { id: "e2", title: "Other" } as any;
    expect(applyEntityUpdate(other, edit)).toBe(other);
  });

  it("keeps a provider with no entity yet empty", () => {
    expect(applyEntityUpdate(null, edit)).toBeNull();
    expect(applyEntityUpdate(undefined, edit)).toBeUndefined();
  });
});

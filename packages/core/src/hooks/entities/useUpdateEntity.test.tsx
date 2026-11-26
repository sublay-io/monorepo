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

  it("uploads images and files as multipart, with removeFileIds as a JSON string", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());
    axiosPrivate.mockResponse("patch", makeEntity());

    const photo = new File(["binary"], "photo.png", { type: "image/png" });
    const doc = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
    const options = { mode: "original-aspect" as const, sizes: { full: 1080 } };

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        update: {
          title: "New title",
          keywords: ["a"],
          nsfw: false,
          removeFileIds: ["file-1"],
          images: { files: [photo], options },
          files: { files: [doc], options: { pathParts: ["docs"] } },
        },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/entities/entity-1");
    const form = call.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("title")).toBe("New title");
    expect(form.get("keywords")).toBe(JSON.stringify(["a"]));
    expect(form.get("nsfw")).toBe("false");
    expect(form.get("removeFileIds")).toBe(JSON.stringify(["file-1"]));
    expect(form.get("images")).toBeInstanceOf(File);
    expect(form.get("images.options")).toBe(JSON.stringify(options));
    expect(form.get("files")).toBeInstanceOf(File);
    expect(form.get("files.options")).toBe(JSON.stringify({ pathParts: ["docs"] }));
    // An upload asks for the entity's files, so the cached copies get the new list.
    expect(form.get("include")).toBe("files");
    expect(call.config?.headers).toMatchObject({
      "Content-Type": "multipart/form-data",
    });
  });

  it("sends removeFileIds alone as a JSON array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());
    axiosPrivate.mockResponse("patch", makeEntity());

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        update: { removeFileIds: ["file-1", "file-2"], images: { files: [], options: { mode: "original-aspect", sizes: { full: 1080 } } } },
      });
    });

    const [call] = axiosPrivate.calls("patch");
    expect(call.body).not.toBeInstanceOf(FormData);
    expect(call.body).toMatchObject({ removeFileIds: ["file-1", "file-2"], include: "files" });
    expect(call.body).not.toHaveProperty("images");
  });

  it("sends no include on a plain edit, and the caller's include as given", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());
    axiosPrivate.mockResponse("patch", makeEntity());
    axiosPrivate.mockResponse("patch", makeEntity());

    await act(async () => {
      await result.current({ entityId: "entity-1", update: { title: "T" } });
    });
    await act(async () => {
      await result.current({ entityId: "entity-1", update: { title: "T", include: ["files"] } });
    });

    const [plain, asked] = axiosPrivate.calls("patch");
    expect(JSON.parse(JSON.stringify(plain.body))).toEqual({ title: "T" });
    expect(asked.body).toMatchObject({ include: ["files"] });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUpdateEntity());

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      result.current({ entityId: "entity-1", update: { title: "New title" } }),
    ).rejects.toMatchObject({ status: 500 });
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

    it("keeps a list copy's files when the response carries none, and takes them when it does", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useUpdateEntity());
      const cachedFiles = [{ id: "file-1" }] as any;
      store.dispatch(
        setEntityListEntities({
          listId: "feed",
          entities: [makeEntity({ files: cachedFiles })],
        }),
      );
      // Without `include: "files"` the response has no `files` key.
      const { files: _files, ...withoutFiles } = makeEntity({ title: "New title" });
      axiosPrivate.mockResponse("patch", withoutFiles);

      await act(async () => {
        await result.current({ entityId: "entity-1", update: { title: "New title" } });
      });
      let [entity] = store.getState().sublay.entityLists.lists.feed.entities;
      expect(entity.title).toBe("New title");
      expect(entity.files).toBe(cachedFiles);

      const newFiles = [{ id: "file-2" }] as any;
      axiosPrivate.mockResponse("patch", makeEntity({ files: newFiles }));
      await act(async () => {
        await result.current({ entityId: "entity-1", update: { removeFileIds: ["file-1"] } });
      });
      [entity] = store.getState().sublay.entityLists.lists.feed.entities;
      expect(entity.files).toEqual(newFiles);
    });

    it("leaves the lists as they are when the edit fails", async () => {
      const { result, axiosPrivate, store } = renderHookWithAxios(() => useUpdateEntity());
      store.dispatch(setEntityListEntities({ listId: "feed", entities: [listEntity()] }));
      const before = store.getState().sublay.entityLists;

      axiosPrivate.mockError("patch", 500, { message: "Internal error" });
      await expect(
        result.current({ entityId: "entity-1", update: { title: "New title" } }),
      ).rejects.toMatchObject({ status: 500 });
      expect(store.getState().sublay.entityLists).toBe(before);
    });
  });
});

describe("applyEntityUpdate", () => {
  it("keeps the copy's files when the response has no files key", () => {
    const files = [{ id: "file-1" }] as any;
    const base = makeEntity({ files });
    const { files: _files, ...edit } = makeEntity({ title: "New" });
    const merged = applyEntityUpdate(base, edit as any) as any;
    expect(merged.files).toBe(files);
    expect(merged.title).toBe("New");
  });

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

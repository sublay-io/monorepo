import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import {
  renderHookWithAxios,
  resetAxiosMocks,
  makeAuthUser,
} from "../../test-utils";
import useCreateComment from "./useCreateComment";
import type { Comment } from "../../interfaces/models/Comment";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCreateComment", () => {
  it("posts the comment and returns the created comment", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    const created: Partial<Comment> = { id: "comment-1", content: "hello" };
    axiosPrivate.mockResponse("post", created, 201);

    let returned: Comment | undefined;
    await act(async () => {
      returned = await result.current({
        entityId: "entity-1",
        content: "hello",
      });
    });

    expect(returned).toEqual(created);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/project-1/comments");
    expect(call.body).toMatchObject({ entityId: "entity-1", content: "hello" });
  });

  it("sends a reply's parent as parentCommentId", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    axiosPrivate.mockResponse("post", { id: "comment-2" }, 201);

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        parentCommentId: "comment-1",
        content: "a reply",
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({ parentCommentId: "comment-1" });
    expect(call.body).not.toHaveProperty("parentId");
  });

  it("posts a comment that has only attachments", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    axiosPrivate.mockResponse("post", { id: "comment-1" }, 201);

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        attachments: [{ url: "https://example.com/a.png" }],
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toMatchObject({
      attachments: [{ url: "https://example.com/a.png" }],
    });
  });

  it("posts a comment that has only images, as multipart", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    axiosPrivate.mockResponse("post", { id: "comment-1", files: [] }, 201);

    const photo = new File(["binary"], "photo.png", { type: "image/png" });
    const doc = new File(["pdf"], "doc.pdf", { type: "application/pdf" });
    const options = { mode: "original-aspect" as const, sizes: { full: 1080 } };

    await act(async () => {
      await result.current({
        entityId: "entity-1",
        parentCommentId: null,
        gif: null,
        mentions: [],
        metadata: { a: 1 },
        images: { files: [photo], options },
        files: { files: [doc] },
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/project-1/comments");
    const form = call.body as FormData;
    expect(form).toBeInstanceOf(FormData);
    expect(form.get("entityId")).toBe("entity-1");
    // On a create a null field is the same as leaving it out.
    expect(form.has("parentCommentId")).toBe(false);
    expect(form.has("gif")).toBe(false);
    expect(form.has("content")).toBe(false);
    expect(form.get("mentions")).toBe("[]");
    expect(form.get("metadata")).toBe(JSON.stringify({ a: 1 }));
    expect(form.get("images")).toBeInstanceOf(File);
    expect(form.get("images.options")).toBe(JSON.stringify(options));
    expect(form.getAll("files")).toHaveLength(1);
    expect(form.has("files.options")).toBe(false);
    expect(call.config?.headers).toMatchObject({
      "Content-Type": "multipart/form-data",
    });
  });

  it("throws before making a request when there is no content, gif or attachment", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    await expect(
      result.current({ entityId: "entity-1", content: "   ", attachments: [] }),
    ).rejects.toThrow("No content, gif, attachments, images or files were provided");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("rejects when the server returns an error response", async () => {
    const user = makeAuthUser({ id: "user-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user,
    });

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ entityId: "entity-1", content: "hello" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no authenticated user", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateComment(), {
      projectId: "project-1",
      user: null,
    });

    await expect(
      result.current({ entityId: "entity-1", content: "hello" }),
    ).rejects.toThrow("No authenticated user");

    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

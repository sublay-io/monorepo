import { createEntity, updateEntity } from "../src/modules/entities";
import { createEvent, updateEvent } from "../src/modules/events";
import { createComment } from "../src/modules/comments";
import { makeClient } from "./helpers/mockClient";

/**
 * Lists: `images` (with `images.options`, a JSON string) and `files` (with an
 * optional `files.options`), on entity, event and comment requests, plus
 * entity `removeFileIds`. JSON is kept when no file is sent.
 */

const FILE_ID = "11111111-1111-4111-8111-111111111111";
const imageOptions = { mode: "original-aspect" as const, sizes: { full: 1000 } };
const bytes = () => new Uint8Array([0x89, 0x50, 0x4e, 0x47]);

function keys(formData: FormData): string[] {
  return [...new Set(formData.keys())].sort();
}

describe("node-sdk file lists — createEntity", () => {
  it("sends images and files with their options as multipart, null fields left out", async () => {
    const { client, projectInstance } = makeClient();
    await createEntity(client, {
      actingUserId: "u1",
      title: "Post",
      sourceId: null,
      keywords: ["a"],
      images: {
        files: [
          { file: bytes(), filename: "a.png", mimeType: "image/png" },
          { file: bytes(), mimeType: "image/png" },
        ],
        options: imageOptions,
      },
      files: { files: [{ file: bytes(), filename: "d.pdf", mimeType: "application/pdf" }], options: { pathParts: ["docs"] } },
    });

    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/entities");
    const formData = body as FormData;
    expect(formData).toBeInstanceOf(FormData);
    expect(keys(formData)).toEqual(
      ["actingUserId", "files", "files.options", "images", "images.options", "keywords", "title"],
    );
    const images = formData.getAll("images") as File[];
    expect(images.map((f) => f.name)).toEqual(["a.png", "image"]);
    expect(images[0].type).toBe("image/png");
    expect(formData.get("images.options")).toBe(JSON.stringify(imageOptions));
    expect((formData.get("files") as File).name).toBe("d.pdf");
    expect(formData.get("files.options")).toBe(JSON.stringify({ pathParts: ["docs"] }));
    expect(formData.get("keywords")).toBe(JSON.stringify(["a"]));
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await createEntity(client, { title: "Post", images: { files: [], options: imageOptions } });
    expect(projectInstance.post).toHaveBeenCalledWith("/entities", { title: "Post" });
  });
});

describe("node-sdk file lists — updateEntity", () => {
  it("sends files and removeFileIds as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateEntity(client, {
      entityId: "e1",
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
      files: { files: [{ file: bytes(), mimeType: "application/pdf" }] },
    });
    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/entities/e1");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(["actingUserId", "files", "removeFileIds"]);
    expect((formData.get("files") as File).name).toBe("file");
    expect(formData.get("removeFileIds")).toBe(JSON.stringify([FILE_ID]));
  });

  it("sends removeFileIds alone as JSON", async () => {
    const { client, projectInstance } = makeClient();
    await updateEntity(client, { entityId: "e1", actingUserId: "u1", removeFileIds: [FILE_ID] });
    expect(projectInstance.patch).toHaveBeenCalledWith("/entities/e1", {
      actingUserId: "u1",
      removeFileIds: [FILE_ID],
    });
  });
});

describe("node-sdk file lists — events", () => {
  it("createEvent sends images and files without a cover", async () => {
    const { client, projectInstance } = makeClient();
    await createEvent(client, {
      actingUserId: "u1",
      title: "Launch",
      type: "online",
      startTime: "2026-07-01T18:00:00.000Z",
      images: { files: [{ file: bytes(), mimeType: "image/png" }], options: imageOptions },
      files: { files: [{ file: bytes(), filename: "agenda.pdf", mimeType: "application/pdf" }] },
    });
    const [, body] = projectInstance.post.mock.calls[0];
    const formData = body as FormData;
    expect(keys(formData)).toEqual(
      ["actingUserId", "files", "images", "images.options", "startTime", "title", "type"],
    );
    expect(formData.has("gallery")).toBe(false);
  });

  it("updateEvent appends images as multipart", async () => {
    const { client, projectInstance } = makeClient();
    await updateEvent(client, {
      eventId: "ev1",
      actingUserId: "u1",
      images: { files: [{ file: bytes(), mimeType: "image/png" }], options: imageOptions },
    });
    const [path, body] = projectInstance.patch.mock.calls[0];
    expect(path).toBe("/events/ev1");
    expect(keys(body as FormData)).toEqual(["actingUserId", "images", "images.options"]);
  });
});

describe("node-sdk file lists — createComment", () => {
  it("sends a comment with only an image as multipart, null fields left out", async () => {
    const { client, projectInstance } = makeClient();
    await createComment(client, {
      actingUserId: "u1",
      entityId: "e1",
      content: null,
      parentCommentId: null,
      images: { files: [{ file: bytes(), mimeType: "image/png" }], options: imageOptions },
    });
    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/comments");
    const formData = body as FormData;
    expect(keys(formData)).toEqual(["actingUserId", "entityId", "images", "images.options"]);
  });

  it("stays JSON without files", async () => {
    const { client, projectInstance } = makeClient();
    await createComment(client, { actingUserId: "u1", entityId: "e1", content: "hi" });
    expect(projectInstance.post).toHaveBeenCalledWith("/comments", {
      actingUserId: "u1",
      entityId: "e1",
      content: "hi",
    });
  });
});

import { deleteFile, getFile, uploadFile, uploadImage } from "../src/modules/storage";
import type { File as SublayFile } from "../src/interfaces/File";
import type { ImageOptions } from "../src/interfaces/ImageProcessing";
import { formDataToObject, makeClient } from "./helpers/client";

/** The fields the old flat encoding sent; the server now refuses each one. */
const FLAT_FIELDS = [
  "mode",
  "dimensions",
  "aspectRatio",
  "widths",
  "heights",
  "sizes",
  "aspectRatios",
  "fit",
  "quality",
  "format",
  "stripExif",
  "originalMaxSize",
  "pathParts",
];

function expectNoFlatFields(fields: Record<string, unknown>) {
  for (const field of FLAT_FIELDS) expect(fields).not.toHaveProperty(field);
  expect(fields).not.toHaveProperty("imageOptions");
}

const FILE = {
  id: "f1",
  userId: "u1",
  entityId: null,
  eventId: null,
  commentId: null,
  chatMessageId: null,
  spaceId: null,
  type: "document" as const,
  originalPath: "https://api.example.com/files/p1/files/f1/doc.pdf",
  originalSize: 1234,
  originalMimeType: "application/pdf",
  position: 0,
  metadata: { originalFilename: "doc.pdf" },
  image: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const IMAGE_FILE = {
  ...FILE,
  id: "f2",
  type: "image" as const,
  originalPath: "https://api.example.com/files/p1/pics/f2/original.webp",
  originalMimeType: "image/webp",
  metadata: {
    originalFilename: "banner.png",
    originalFormat: "png",
    originalDimensions: { width: 2000, height: 1000 },
  },
  image: {
    originalWidth: 2000,
    originalHeight: 1000,
    variants: {
      full: {
        width: 1000,
        height: 500,
        size: 2000,
        format: "webp",
        publicPath: "https://api.example.com/files/p1/pics/f2/full.webp",
      },
    },
    processingStatus: "completed" as const,
    processingError: null,
    format: "webp",
    quality: 80,
    exifStripped: true,
    createdAt: "2026-06-01T00:00:00.000Z",
    updatedAt: "2026-06-01T00:00:00.000Z",
  },
};

describe("js-sdk storage — uploadFile request shaping", () => {
  it("posts the file, the folder inside `file.options` and the metadata", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["avatar-bytes"], "avatar.png", {
      type: "image/png",
    });
    await uploadFile(client, {
      file,
      filename: "custom-name.png",
      pathParts: ["avatars", "u1"],
      metadata: { source: "upload" },
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/storage");
    expect(body).toBeInstanceOf(FormData);

    const fields = formDataToObject(body as FormData);
    expect(Object.keys(fields).sort()).toEqual(["file", "file.options", "metadata"]);
    expect(fields.file).toBeInstanceOf(File);
    expect((fields.file as File).name).toBe("custom-name.png");
    expect(fields["file.options"]).toBe(JSON.stringify({ pathParts: ["avatars", "u1"] }));
    expect(fields.metadata).toBe(JSON.stringify({ source: "upload" }));
  });

  it("defaults the multipart filename to the File's own name when no explicit filename is given", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "original.png", { type: "image/png" });
    await uploadFile(client, { file, pathParts: ["files"] });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect((fields.file as File).name).toBe("original.png");
  });

  it("falls back to 'upload' as the filename when given a nameless Blob and no explicit filename", async () => {
    const { client, projectInstance } = makeClient();
    const blob = new Blob(["bytes"], { type: "image/png" });
    await uploadFile(client, { file: blob, pathParts: ["files"] });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect((fields.file as File).name).toBe("upload");
  });

  it("without pathParts or metadata sends the file alone (the server's `files` folder)", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "f.png", { type: "image/png" });
    await uploadFile(client, { file });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect(Object.keys(fields)).toEqual(["file"]);
  });
});

describe("js-sdk storage — uploadImage request shaping", () => {
  it("sends the options as one `file.options` JSON field, never as flat fields", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "banner.png", { type: "image/png" });
    await uploadImage(client, {
      file,
      imageOptions: {
        mode: "exact-dimensions",
        dimensions: { thumbnail: { width: 100, height: 100 } },
        fit: "cover",
      },
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, body] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/storage/images");
    expect(body).toBeInstanceOf(FormData);

    const fields = formDataToObject(body as FormData);
    expect(Object.keys(fields).sort()).toEqual(["file", "file.options"]);
    expect(fields.file).toBeInstanceOf(File);
    expect(fields["file.options"]).toBe(
      JSON.stringify({
        mode: "exact-dimensions",
        dimensions: { thumbnail: { width: 100, height: 100 } },
        fit: "cover",
      })
    );
    expectNoFlatFields(fields);
  });

  it.each<ImageOptions>([
    {
      mode: "aspect-ratio-width-based",
      aspectRatio: { width: 16, height: 9 },
      widths: { hero: 1200 },
    },
    {
      mode: "aspect-ratio-height-based",
      aspectRatio: { width: 4, height: 3 },
      heights: { card: 400 },
    },
    {
      mode: "original-aspect",
      sizes: { thumbnail: 1, full: 10000 },
      fit: "inside",
    },
    {
      mode: "multi-aspect-ratio",
      aspectRatios: [
        { width: 16, height: 9 },
        { width: 1, height: 1 },
      ],
      sizes: { hero: 1200 },
    },
  ])("sends $mode options whole inside `file.options`", async (imageOptions) => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "hero.png", { type: "image/png" });
    await uploadImage(client, { file, imageOptions });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect(JSON.parse(fields["file.options"] as string)).toEqual(imageOptions);
    expectNoFlatFields(fields);
  });

  it("puts pathParts inside `file.options`, with originalMaxSize and the common options", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "banner.png", { type: "image/png" });
    await uploadImage(client, {
      file,
      imageOptions: {
        mode: "original-aspect",
        sizes: { full: 1000 },
        quality: 80,
        format: "jpeg",
        stripExif: false,
        originalMaxSize: 2000,
        pathParts: ["spaces", "s1", "banner"],
      },
    });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect(JSON.parse(fields["file.options"] as string)).toEqual({
      mode: "original-aspect",
      sizes: { full: 1000 },
      quality: 80,
      format: "jpeg",
      stripExif: false,
      originalMaxSize: 2000,
      pathParts: ["spaces", "s1", "banner"],
    });
    expectNoFlatFields(fields);
  });

  it("sends `imageOptions.pathParts` inside `file.options`", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "x.png", { type: "image/png" });
    await uploadImage(client, {
      file,
      imageOptions: { mode: "original-aspect", sizes: { full: 100 }, pathParts: ["pics"] },
    });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect(JSON.parse(fields["file.options"] as string).pathParts).toEqual(["pics"]);
  });

  it("sends metadata as its own JSON field", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "x.png", { type: "image/png" });
    await uploadImage(client, {
      file,
      imageOptions: { mode: "original-aspect", sizes: { full: 100 } },
      metadata: { label: "cover" },
    });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect(fields.metadata).toBe(JSON.stringify({ label: "cover" }));
    expect(JSON.parse(fields["file.options"] as string)).not.toHaveProperty("metadata");
  });

  it("uses the explicit filename over the File's own name when both are given", async () => {
    const { client, projectInstance } = makeClient();
    const file = new File(["bytes"], "original.png", { type: "image/png" });
    await uploadImage(client, {
      file,
      filename: "renamed.png",
      imageOptions: { mode: "original-aspect", sizes: { full: 1000 } },
    });

    const [, body] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(body as FormData);
    expect((fields.file as File).name).toBe("renamed.png");
  });
});

describe("js-sdk storage — getFile/deleteFile request shaping", () => {
  it("getFile gets /storage/:fileId with no params", async () => {
    const { client, projectInstance } = makeClient();
    await getFile(client, { fileId: "f1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/storage/f1");
    expect(projectInstance.get.mock.calls[0]).toHaveLength(1);
  });

  it("deleteFile deletes /storage/:fileId with no body/params", async () => {
    const { client, projectInstance } = makeClient();
    await deleteFile(client, { fileId: "f1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/storage/f1");
    expect(projectInstance.delete.mock.calls[0]).toHaveLength(1);
  });
});

describe("js-sdk storage — response mapping", () => {
  it("uploadFile returns the File", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({ data: FILE });
    const file = new File(["bytes"], "doc.pdf", { type: "application/pdf" });

    const response: SublayFile = await uploadFile(client, {
      file,
      pathParts: ["docs"],
    });

    expect(response).toEqual(FILE);
  });

  it("uploadImage returns the File with its image", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({ data: IMAGE_FILE });
    const file = new File(["bytes"], "banner.png", { type: "image/png" });

    const response: SublayFile = await uploadImage(client, {
      file,
      imageOptions: { mode: "original-aspect", sizes: { full: 1000 } },
    });

    expect(response).toEqual(IMAGE_FILE);
  });

  it("getFile returns the File", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.get.mockResolvedValueOnce({ data: IMAGE_FILE });

    const response: SublayFile = await getFile(client, { fileId: "f2" });

    expect(response).toEqual(IMAGE_FILE);
  });

  it("deleteFile resolves to undefined (void)", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.delete.mockResolvedValueOnce({ data: undefined });

    const response = await deleteFile(client, { fileId: "f1" });

    expect(response).toBeUndefined();
  });
});

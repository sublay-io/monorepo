import { deleteFile, getFile, uploadFile, uploadImage } from "../src/modules/storage";
import type { File as SublayFile } from "../src/interfaces/File";
import type { ImageOptions } from "../src/interfaces/ImageProcessing";
import { makeClient } from "./helpers/mockClient";

function formDataToObject(formData: FormData): Record<string, FormDataEntryValue> {
  const obj: Record<string, FormDataEntryValue> = {};
  for (const [key, value] of formData.entries()) {
    obj[key] = value;
  }
  return obj;
}

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
  metadata: { originalName: "doc.pdf", uploadedAt: "2026-06-01T00:00:00.000Z" },
  image: null,
  createdAt: "2026-06-01T00:00:00.000Z",
  updatedAt: "2026-06-01T00:00:00.000Z",
};

const IMAGE_FILE = {
  ...FILE,
  id: "f2",
  type: "image" as const,
  originalPath: "https://api.example.com/files/p1/pics/f2/original.webp",
  originalMimeType: "image/png",
  metadata: { originalName: "banner.png", uploadedAt: "2026-06-01T00:00:00.000Z" },
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

describe("node-sdk storage — uploadFile request shaping", () => {
  it("posts the file, the folder inside `file.options`, the metadata and the acting user", async () => {
    const { client, projectInstance } = makeClient();
    await uploadFile(client, {
      file: new Uint8Array([1, 2, 3]),
      filename: "avatar.png",
      mimeType: "image/png",
      pathParts: ["avatars", "u1"],
      metadata: { source: "upload" },
      actingUserId: "u1",
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, formData] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/storage");
    expect(formData).toBeInstanceOf(FormData);

    const fields = formDataToObject(formData as FormData);
    expect(Object.keys(fields).sort()).toEqual(["actingUserId", "file", "file.options", "metadata"]);
    expect(fields.file).toBeInstanceOf(Blob);
    expect((fields.file as File).name).toBe("avatar.png");
    expect(fields["file.options"]).toBe(JSON.stringify({ pathParts: ["avatars", "u1"] }));
    expect(fields.metadata).toBe(JSON.stringify({ source: "upload" }));
    expect(fields.actingUserId).toBe("u1");
  });

  it("defaults the filename to 'upload' and, without pathParts, sends the file alone", async () => {
    const { client, projectInstance } = makeClient();
    await uploadFile(client, { file: new Uint8Array([1]) });

    const [, formData] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(formData as FormData);
    expect((fields.file as File).name).toBe("upload");
    expect(Object.keys(fields)).toEqual(["file"]);
  });
});

describe("node-sdk storage — uploadImage request shaping", () => {
  it("sends the options as one `file.options` JSON field, pathParts inside, never as flat fields", async () => {
    const { client, projectInstance } = makeClient();
    await uploadImage(client, {
      file: new Uint8Array([1, 2, 3]),
      imageOptions: {
        mode: "exact-dimensions",
        dimensions: { thumbnail: { width: 100, height: 100 } },
        fit: "cover",
        originalMaxSize: 2000,
      },
      pathParts: ["spaces", "s1", "banner"],
      actingUserId: "u1",
    });

    expect(projectInstance.post).toHaveBeenCalledTimes(1);
    const [path, formData] = projectInstance.post.mock.calls[0];
    expect(path).toBe("/storage/images");
    const fields = formDataToObject(formData as FormData);
    expect(Object.keys(fields).sort()).toEqual(["actingUserId", "file", "file.options"]);
    expect(fields.file).toBeInstanceOf(Blob);
    expect(JSON.parse(fields["file.options"] as string)).toEqual({
      mode: "exact-dimensions",
      dimensions: { thumbnail: { width: 100, height: 100 } },
      fit: "cover",
      originalMaxSize: 2000,
      pathParts: ["spaces", "s1", "banner"],
    });
    expect(fields.actingUserId).toBe("u1");
    expectNoFlatFields(fields);
  });

  it.each<ImageOptions>([
    { mode: "aspect-ratio-width-based", aspectRatio: { width: 16, height: 9 }, widths: { hero: 1200 } },
    { mode: "aspect-ratio-height-based", aspectRatio: { width: 4, height: 3 }, heights: { card: 400 } },
    { mode: "original-aspect", sizes: { thumbnail: 1, full: 10000 }, fit: "inside" },
    {
      mode: "multi-aspect-ratio",
      aspectRatios: [{ width: 1, height: 1 }],
      sizes: { hero: 1200 },
      quality: 70,
      format: "png",
      stripExif: true,
    },
  ])("sends $mode options whole inside `file.options`", async (imageOptions) => {
    const { client, projectInstance } = makeClient();
    await uploadImage(client, { file: new Uint8Array([1, 2, 3]), imageOptions });

    const [, formData] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(formData as FormData);
    expect(JSON.parse(fields["file.options"] as string)).toEqual(imageOptions);
    expectNoFlatFields(fields);
  });

  it("keeps `imageOptions.pathParts` when no top-level pathParts is given", async () => {
    const { client, projectInstance } = makeClient();
    await uploadImage(client, {
      file: new Uint8Array([1]),
      imageOptions: { mode: "original-aspect", sizes: { full: 100 }, pathParts: ["pics"] },
    });

    const [, formData] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(formData as FormData);
    expect(JSON.parse(fields["file.options"] as string).pathParts).toEqual(["pics"]);
  });

  it("sends metadata as its own JSON field", async () => {
    const { client, projectInstance } = makeClient();
    await uploadImage(client, {
      file: new Uint8Array([1]),
      imageOptions: { mode: "original-aspect", sizes: { full: 100 } },
      metadata: { label: "cover" },
    });

    const [, formData] = projectInstance.post.mock.calls[0];
    const fields = formDataToObject(formData as FormData);
    expect(fields.metadata).toBe(JSON.stringify({ label: "cover" }));
    expect(JSON.parse(fields["file.options"] as string)).not.toHaveProperty("metadata");
  });
});

describe("node-sdk storage — getFile/deleteFile request shaping", () => {
  it("getFile hits /storage/:fileId", async () => {
    const { client, projectInstance } = makeClient();
    await getFile(client, { fileId: "f1" });
    expect(projectInstance.get).toHaveBeenCalledWith("/storage/f1");
  });

  it("deleteFile deletes /storage/:fileId", async () => {
    const { client, projectInstance } = makeClient();
    await deleteFile(client, { fileId: "f1", actingUserId: "u1" });
    expect(projectInstance.delete).toHaveBeenCalledWith("/storage/f1", {
      params: { actingUserId: "u1" },
    });
  });
});

describe("node-sdk storage — response mapping", () => {
  it("uploadFile returns the File", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({ data: FILE });
    const response: SublayFile = await uploadFile(client, {
      file: new Uint8Array([1]),
      pathParts: ["docs"],
    });
    expect(response).toEqual(FILE);
  });

  it("uploadImage returns the File with its image", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.post.mockResolvedValueOnce({ data: IMAGE_FILE });
    const response: SublayFile = await uploadImage(client, {
      file: new Uint8Array([1]),
      imageOptions: { mode: "original-aspect", sizes: { full: 2000 } },
    });
    expect(response).toEqual(IMAGE_FILE);
  });

  it("getFile returns the File", async () => {
    const { client, projectInstance } = makeClient();
    projectInstance.get.mockResolvedValueOnce({ data: IMAGE_FILE });
    const response: SublayFile = await getFile(client, { fileId: "f2" });
    expect(response).toEqual(IMAGE_FILE);
  });

  it("deleteFile resolves to undefined", async () => {
    const { client } = makeClient();
    await expect(deleteFile(client, { fileId: "f1" })).resolves.toBeUndefined();
  });
});

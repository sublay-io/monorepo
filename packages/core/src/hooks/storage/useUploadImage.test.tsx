import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUploadImage from "./useUploadImage";
import type { File as SublayFile } from "../../interfaces/models/File";

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

function expectNoFlatFields(formData: FormData) {
  for (const field of FLAT_FIELDS) expect(formData.has(field)).toBe(false);
}

afterEach(() => {
  resetAxiosMocks();
});

function makeImageResponse(overrides: Partial<SublayFile> = {}): SublayFile {
  return {
    id: "file-1",
    userId: "user-1",
    entityId: null,
    eventId: null,
    commentId: null,
    chatMessageId: null,
    spaceId: null,
    type: "image",
    originalPath: "/files/original.webp",
    originalSize: 4096,
    originalMimeType: "image/png",
    position: 0,
    metadata: { originalFilename: "photo.png", originalFormat: "png", originalDimensions: { width: 800, height: 600 } },
    image: {
      originalWidth: 1080,
      originalHeight: 1080,
      variants: {
        thumbnail: {
          publicPath: "/files/thumbnail.webp",
          width: 100,
          height: 100,
          size: 512,
          format: "webp",
        },
      },
      processingStatus: "completed",
      processingError: null,
      format: "webp",
      quality: 85,
      exifStripped: true,
      createdAt: "2024-01-01T00:00:00.000Z",
      updatedAt: "2024-01-01T00:00:00.000Z",
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useUploadImage", () => {
  it("uploads an image in exact-dimensions mode, its options as one `file.options` field", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    const response = makeImageResponse();
    axiosPrivate.mockResponse("post", response);

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    let returned: SublayFile | undefined;
    await act(async () => {
      returned = await result.current.uploadImage(file, {
        mode: "exact-dimensions",
        dimensions: { thumbnail: { width: 100, height: 100 } },
      });
    });

    expect(returned).toEqual(response);
    expect(result.current.uploading).toBe(false);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/storage/images");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("file.options")).toBe(
      JSON.stringify({
        mode: "exact-dimensions",
        dimensions: { thumbnail: { width: 100, height: 100 } },
      }),
    );
    expectNoFlatFields(formData);
    expect(formData.has("metadata")).toBe(false);
  });

  it("uploads an image in aspect-ratio-width-based mode", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.uploadImage(file, {
        mode: "aspect-ratio-width-based",
        aspectRatio: { width: 16, height: 9 },
        widths: { small: 320, large: 1280 },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(JSON.parse(formData.get("file.options") as string)).toEqual({
      mode: "aspect-ratio-width-based",
      aspectRatio: { width: 16, height: 9 },
      widths: { small: 320, large: 1280 },
    });
    expectNoFlatFields(formData);
  });

  it("uploads an image in multi-aspect-ratio mode", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.uploadImage(file, {
        mode: "multi-aspect-ratio",
        aspectRatios: [
          { width: 1, height: 1 },
          { width: 16, height: 9 },
        ],
        sizes: { small: 320, large: 1280 },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(JSON.parse(formData.get("file.options") as string)).toEqual({
      mode: "multi-aspect-ratio",
      aspectRatios: [
        { width: 1, height: 1 },
        { width: 16, height: 9 },
      ],
      sizes: { small: 320, large: 1280 },
    });
    expectNoFlatFields(formData);
  });

  it("sends every option, pathParts and originalMaxSize included, inside `file.options`", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.uploadImage(file, {
        mode: "original-aspect",
        sizes: { full: 1080 },
        fit: "inside",
        quality: 80,
        format: "jpeg",
        stripExif: false,
        originalMaxSize: 2000,
        pathParts: ["pics"],
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(JSON.parse(formData.get("file.options") as string)).toEqual({
      mode: "original-aspect",
      sizes: { full: 1080 },
      fit: "inside",
      quality: 80,
      format: "jpeg",
      stripExif: false,
      originalMaxSize: 2000,
      pathParts: ["pics"],
    });
    expectNoFlatFields(formData);
  });

  it("sends `metadata` as its own field, never inside `file.options`", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current.uploadImage(file, {
        mode: "original-aspect",
        sizes: { full: 1080 },
        metadata: { label: "cover" },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.get("metadata")).toBe(JSON.stringify({ label: "cover" }));
    expect(JSON.parse(formData.get("file.options") as string)).toEqual({
      mode: "original-aspect",
      sizes: { full: 1080 },
    });
  });

  it("tracks upload progress via onUploadProgress and resets after completion", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });
    const onProgress = vi.fn();

    let uploadPromise!: Promise<SublayFile>;
    act(() => {
      uploadPromise = result.current.uploadImage(file, {
        mode: "original-aspect",
        sizes: { full: 1080 },
        onProgress,
      });
    });

    expect(result.current.uploading).toBe(true);

    const [call] = axiosPrivate.calls("post");
    act(() => {
      call.config?.onUploadProgress?.({ loaded: 50, total: 100 } as any);
    });

    expect(result.current.progress).toBe(50);
    expect(onProgress).toHaveBeenCalledWith(50);
    // The callback is the call's own; it never goes inside `file.options`.
    expect(JSON.parse((call.body as FormData).get("file.options") as string)).toEqual({
      mode: "original-aspect",
      sizes: { full: 1080 },
    });

    await act(async () => {
      await uploadPromise;
    });

    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
  });

  it("resets uploading to false when the request fails", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await expect(
      result.current.uploadImage(file, { mode: "original-aspect", sizes: { full: 1080 } }),
    ).rejects.toMatchObject({ response: { status: 500 } });

    await waitFor(() => expect(result.current.uploading).toBe(false));
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage(), {
      projectId: "",
    });

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await expect(
      result.current.uploadImage(file, { mode: "original-aspect", sizes: { full: 1080 } }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when no file is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    await expect(
      result.current.uploadImage(null as any, {
        mode: "original-aspect",
        sizes: { full: 1080 },
      }),
    ).rejects.toThrow("No file provided.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

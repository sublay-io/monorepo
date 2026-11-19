import { describe, it, expect, afterEach, vi } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUploadImage from "./useUploadImage";
import type { Image } from "../../interfaces/models/Image";

afterEach(() => {
  resetAxiosMocks();
});

function makeImageResponse(overrides: Partial<Image> = {}): Image {
  return {
    fileId: "file-1",
    imageId: "file-1",
    status: "completed",
    original: {
      path: "images/original.webp",
      publicPath: "/files/original.webp",
      width: 1080,
      height: 1080,
      size: 2048,
      format: "webp",
    },
    variants: {},
    metadata: {
      originalFormat: "png",
      originalSize: 4096,
      exifStripped: true,
      processingTime: 120,
    },
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useUploadImage", () => {
  it("uploads an image in exact-dimensions mode with an entity association", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    const response = makeImageResponse();
    axiosPrivate.mockResponse("post", response);

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    let returned: Image | undefined;
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
    expect(formData.get("mode")).toBe("exact-dimensions");
    expect(formData.get("dimensions")).toBe(
      JSON.stringify({ thumbnail: { width: 100, height: 100 } }),
    );
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
    expect(formData.get("aspectRatio")).toBe(JSON.stringify({ width: 16, height: 9 }));
    expect(formData.get("widths")).toBe(JSON.stringify({ small: 320, large: 1280 }));
  });

  it("tracks upload progress via onUploadProgress and resets after completion", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadImage());

    axiosPrivate.mockResponse("post", makeImageResponse());

    const file = new File(["binary"], "photo.png", { type: "image/png" });
    const onProgress = vi.fn();

    let uploadPromise!: Promise<Image>;
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

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUploadFile from "./useUploadFile";
import type { File as SublayFile } from "../../interfaces/models/File";

afterEach(() => {
  resetAxiosMocks();
});

function makeUploadResponse(overrides: Partial<SublayFile> = {}): SublayFile {
  return {
    id: "file-1",
    userId: "user-1",
    entityId: null,
    eventId: null,
    commentId: null,
    chatMessageId: null,
    spaceId: null,
    type: "document",
    originalPath: "/files/file-1.pdf",
    originalSize: 1024,
    originalMimeType: "application/pdf",
    position: 0,
    metadata: { originalFilename: "doc.pdf" },
    image: null,
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useUploadFile", () => {
  it("uploads a browser File as multipart FormData", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    const response = makeUploadResponse();
    axiosPrivate.mockResponse("post", response);

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    let returned: SublayFile | undefined;
    await act(async () => {
      returned = await result.current.uploadFile({ file, pathParts: ["uploads"] });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/storage");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("file")).toBeInstanceOf(File);
    // The folder goes inside `file.options`, never as a top-level field.
    expect(formData.get("file.options")).toBe(JSON.stringify({ pathParts: ["uploads"] }));
    expect(formData.has("pathParts")).toBe(false);
    expect(formData.has("position")).toBe(false);
  });

  it("sends no `file.options` without pathParts (the server's `files` folder)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockResponse("post", makeUploadResponse());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.uploadFile({ file });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.has("file.options")).toBe(false);
    expect(formData.has("pathParts")).toBe(false);
  });

  it("uploads a React Native-shaped file object", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockResponse("post", makeUploadResponse());

    await act(async () => {
      await result.current.uploadFile({
        file: { uri: "file:///tmp/doc.pdf", name: "doc.pdf", type: "application/pdf" },
        pathParts: ["uploads"],
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.get("file")).not.toBeInstanceOf(File);
  });

  it("includes metadata in the FormData, and never a position", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockResponse("post", makeUploadResponse());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current.uploadFile({
        file,
        pathParts: ["uploads"],
        metadata: { source: "test" },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.has("position")).toBe(false);
    expect(formData.get("metadata")).toBe(JSON.stringify({ source: "test" }));
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current.uploadFile({ file, pathParts: ["uploads"] })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when no file is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    await expect(result.current.uploadFile({ file: null as any, pathParts: ["uploads"] })).rejects.toThrow(
      "No file provided.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when pathParts isn't an array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current.uploadFile({ file, pathParts: "uploads" as any })).rejects.toThrow(
      "Invalid arguments. pathParts must be an array.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile(), {
      projectId: "",
    });

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current.uploadFile({ file, pathParts: ["uploads"] })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("sends exactly the file, `file.options` and `metadata` fields", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());
    axiosPrivate.mockResponse("post", makeUploadResponse());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });
    await act(async () => {
      await result.current.uploadFile({
        file,
        pathParts: ["a", "b"],
        metadata: { k: 1 },
        onProgress: () => {},
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/storage");
    const formData = call.body as FormData;
    expect([...formData.keys()]).toEqual(["file", "file.options", "metadata"]);
    expect((formData.get("file") as File).name).toBe("doc.pdf");
    expect(formData.get("file.options")).toBe(JSON.stringify({ pathParts: ["a", "b"] }));
    expect(formData.get("metadata")).toBe(JSON.stringify({ k: 1 }));
    expect(call.config?.headers).toMatchObject({ "Content-Type": "multipart/form-data" });
  });

  it("tracks upload progress via onUploadProgress and resets after completion", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());
    axiosPrivate.mockResponse("post", makeUploadResponse());
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);

    const seen: number[] = [];
    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });
    let uploadPromise!: Promise<SublayFile>;
    act(() => {
      uploadPromise = result.current.uploadFile({ file, onProgress: (p) => seen.push(p) });
    });
    expect(result.current.uploading).toBe(true);

    const [call] = axiosPrivate.calls("post");
    act(() => {
      call.config?.onUploadProgress?.({ loaded: 50, total: 100 } as any);
    });
    expect(result.current.progress).toBe(50);
    expect(seen).toEqual([50]);
    // The callback is the call's own; nothing about it is sent.
    expect([...(call.body as FormData).keys()]).toEqual(["file"]);

    await act(async () => {
      await uploadPromise;
    });
    expect(result.current.uploading).toBe(false);
    expect(result.current.progress).toBe(0);
  });
});

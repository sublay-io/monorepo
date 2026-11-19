import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useUploadFile, { type UploadResponse } from "./useUploadFile";

afterEach(() => {
  resetAxiosMocks();
});

function makeUploadResponse(overrides: Partial<UploadResponse> = {}): UploadResponse {
  return {
    fileId: "file-1",
    type: "document",
    relativePath: "uploads/file-1.pdf",
    publicPath: "/files/file-1.pdf",
    size: 1024,
    mimeType: "application/pdf",
    createdAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

describe("useUploadFile", () => {
  it("uploads a browser File as multipart FormData", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    const response = makeUploadResponse();
    axiosPrivate.mockResponse("post", response);

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    let returned: UploadResponse | undefined;
    await act(async () => {
      returned = await result.current(file, ["uploads"]);
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/storage");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("file")).toBeInstanceOf(File);
    expect(formData.get("pathParts")).toBe(JSON.stringify(["uploads"]));
  });

  it("uploads a React Native-shaped file object", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockResponse("post", makeUploadResponse());

    await act(async () => {
      await result.current(
        { uri: "file:///tmp/doc.pdf", name: "doc.pdf", type: "application/pdf" },
        ["uploads"],
      );
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.get("file")).not.toBeInstanceOf(File);
  });

  it("includes position and metadata in the FormData", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockResponse("post", makeUploadResponse());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await act(async () => {
      await result.current(file, ["uploads"], {
        position: 2,
        metadata: { source: "test" },
      });
    });

    const [call] = axiosPrivate.calls("post");
    const formData = call.body as FormData;
    expect(formData.get("position")).toBe("2");
    expect(formData.get("metadata")).toBe(JSON.stringify({ source: "test" }));
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current(file, ["uploads"])).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when file or pathParts is invalid", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile());

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current(file, undefined as any)).rejects.toThrow(
      "Invalid arguments. File and pathParts are required.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useUploadFile(), {
      projectId: "",
    });

    const file = new File(["binary"], "doc.pdf", { type: "application/pdf" });

    await expect(result.current(file, ["uploads"])).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

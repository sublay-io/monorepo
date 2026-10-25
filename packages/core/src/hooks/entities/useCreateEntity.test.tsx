import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEntity } from "../../test-utils";
import useCreateEntity from "./useCreateEntity";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCreateEntity", () => {
  it("creates an entity via a plain JSON request when there are no files/images", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEntity());

    const created = makeEntity({ title: "Hello" });
    axiosPrivate.mockResponse("post", created, 201);

    let returned: typeof created | undefined;
    await act(async () => {
      returned = await result.current({ title: "Hello" });
    });

    expect(returned).toEqual(created);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/entities");
    expect(call.body).toMatchObject({ title: "Hello" });
    expect(call.body instanceof FormData).toBe(false);
  });

  it("creates an entity via multipart FormData when images are provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEntity());

    const created = makeEntity({ title: "With image" });
    axiosPrivate.mockResponse("post", created, 201);

    const file = new File(["binary"], "photo.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        title: "With image",
        images: {
          files: [file],
          options: { mode: "original-aspect", sizes: { full: 1080 } },
        },
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect(formData.get("title")).toBe("With image");
    expect(formData.get("images.files")).toBeInstanceOf(File);
    expect(formData.get("images.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 1080 } }),
    );
    expect(call.config?.headers).toMatchObject({
      "Content-Type": "multipart/form-data",
    });
  });

  it("sourceId null: JSON sends null (no source); multipart leaves the field out", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEntity());
    axiosPrivate.mockResponse("post", makeEntity(), 201);
    axiosPrivate.mockResponse("post", makeEntity(), 201);

    await act(async () => {
      await result.current({ title: "Plain", sourceId: null });
    });
    await act(async () => {
      await result.current({
        title: "With image",
        sourceId: null,
        images: { files: [new File(["b"], "p.png", { type: "image/png" })] },
      });
    });

    const [json, multipart] = axiosPrivate.calls("post");
    expect(json.body).toMatchObject({ sourceId: null });
    expect((multipart.body as FormData).has("sourceId")).toBe(false);
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEntity());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(result.current({ title: "Hello" })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateEntity(), {
      projectId: "",
    });

    await expect(result.current({ title: "Hello" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

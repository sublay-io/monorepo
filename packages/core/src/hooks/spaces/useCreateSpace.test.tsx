import { describe, it, expect, afterEach, vi } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpace } from "../../test-utils";
import useCreateSpace from "./useCreateSpace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCreateSpace", () => {
  it("creates a space via a plain JSON request when there are no image uploads", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());

    const created = makeSpace({ name: "Design" });
    axiosPrivate.mockResponse("post", created, 201);

    let returned: typeof created | undefined;
    await act(async () => {
      returned = await result.current({ name: "Design" });
    });

    expect(returned).toEqual(created);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces");
    expect(call.body).toMatchObject({ name: "Design" });
    expect(call.body instanceof FormData).toBe(false);
  });

  it("creates a space via multipart FormData when an avatar is provided", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());

    axiosPrivate.mockResponse("post", makeSpace(), 201);

    const file = new File(["binary"], "avatar.png", { type: "image/png" });

    await act(async () => {
      await result.current({
        name: "Design",
        avatarFile: { file, options: { mode: "original-aspect", sizes: { full: 256 } } },
      });
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body instanceof FormData).toBe(true);
    const formData = call.body as FormData;
    expect([...formData.keys()].sort()).toEqual(["avatarFile", "avatarFile.options", "name"]);
    expect(formData.get("name")).toBe("Design");
    expect(formData.get("avatarFile")).toBeInstanceOf(File);
    expect(formData.get("avatarFile.options")).toBe(
      JSON.stringify({ mode: "original-aspect", sizes: { full: 256 } }),
    );
  });

  it("sends a banner as bannerFile + bannerFile.options", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());
    axiosPrivate.mockResponse("post", makeSpace(), 201);

    const file = new File(["binary"], "banner.png", { type: "image/png" });
    const options = { mode: "original-aspect" as const, sizes: { full: 1200 } };
    await act(async () => {
      await result.current({ name: "Design", bannerFile: { file, options } });
    });

    const formData = axiosPrivate.calls("post")[0].body as FormData;
    expect((formData.get("bannerFile") as File).name).toBe("banner.png");
    expect(formData.get("bannerFile.options")).toBe(JSON.stringify(options));
    expect(formData.has("avatarFile")).toBe(false);
  });

  it("appends a React Native file ({ uri, name, type }) as FormData expects it", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());
    axiosPrivate.mockResponse("post", makeSpace(), 201);

    const appendSpy = vi.spyOn(FormData.prototype, "append");
    const nativeFile = { uri: "file:///avatar.jpg", name: "avatar.jpg", type: "image/jpeg" };
    await act(async () => {
      await result.current({
        name: "Design",
        avatarFile: { file: nativeFile, options: { mode: "original-aspect", sizes: { full: 256 } } },
      });
    });

    expect(appendSpy).toHaveBeenCalledWith("avatarFile", nativeFile);
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(result.current({ name: "Design" })).rejects.toMatchObject({
      response: { status: 500 },
    });
  });

  it("creates a space without a name", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());
    axiosPrivate.mockResponse("post", makeSpace({ name: null }), 201);

    await act(async () => {
      await result.current({});
    });

    const [call] = axiosPrivate.calls("post");
    expect(call.body).toEqual({});
  });

  it("leaves `null` fields out of a multipart create", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace());
    axiosPrivate.mockResponse("post", makeSpace(), 201);

    const file = new File(["binary"], "avatar.png", { type: "image/png" });
    await act(async () => {
      await result.current({
        name: null,
        slug: null,
        description: null,
        parentSpaceId: null,
        nsfw: true,
        metadata: { a: 1 },
        avatarFile: { file, options: { mode: "original-aspect", sizes: { full: 256 } } },
      });
    });

    const formData = axiosPrivate.calls("post")[0].body as FormData;
    expect([...formData.keys()].sort()).toEqual([
      "avatarFile",
      "avatarFile.options",
      "metadata",
      "nsfw",
    ]);
    expect(formData.get("nsfw")).toBe("true");
    expect(formData.get("metadata")).toBe(JSON.stringify({ a: 1 }));
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCreateSpace(), {
      projectId: "",
    });

    await expect(result.current({ name: "Design" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

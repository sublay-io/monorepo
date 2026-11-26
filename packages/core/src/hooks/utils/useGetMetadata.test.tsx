import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useGetMetadata from "./useGetMetadata";
import type { UrlMetadata } from "../../interfaces/UrlMetadata";

afterEach(() => {
  resetAxiosMocks();
});

function makeMetadata(overrides: Partial<UrlMetadata> = {}): UrlMetadata {
  return {
    title: "Example",
    description: null,
    siteName: null,
    url: "https://example.com",
    type: null,
    locale: null,
    charset: null,
    favicon: null,
    images: [],
    videos: [],
    audio: [],
    twitter: { card: null, site: null, creator: null, title: null, description: null, images: [], players: [] },
    article: { publishedTime: null, modifiedTime: null, expirationTime: null, author: null, section: null, tag: null },
    jsonLd: null,
    appLinks: { ios: null, android: null, web: null },
    book: null,
    music: null,
    profile: null,
    requestUrl: "https://example.com",
    success: true,
    ...overrides,
  };
}

describe("useGetMetadata", () => {
  it("fetches metadata for an absolute URL", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useGetMetadata());

    const metadata = makeMetadata();
    axiosPrivate.mockResponse("get", metadata);

    let returned: UrlMetadata | undefined;
    await act(async () => {
      returned = await result.current({ url: "https://example.com" });
    });

    expect(returned).toEqual(metadata);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/utils/get-metadata");
    expect(call.config?.params).toEqual({ url: "https://example.com" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useGetMetadata());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ url: "https://example.com" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request for a relative/non-absolute URL", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useGetMetadata());

    await expect(result.current({ url: "example.com" })).rejects.toThrow(
      "Please provide an absolute URL",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when no URL is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useGetMetadata());

    await expect(result.current({ url: "" })).rejects.toThrow(
      "Please specify a URL",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useGetMetadata(), {
      projectId: "",
    });

    await expect(
      result.current({ url: "https://example.com" }),
    ).rejects.toThrow("No project specified");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

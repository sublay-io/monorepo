import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpaceDetailed } from "../../test-utils";
import useFetchSpaceBySlug from "./useFetchSpaceBySlug";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchSpaceBySlug", () => {
  it("fetches a space by slug", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceBySlug());

    const space = makeSpaceDetailed({ slug: "design" });
    axiosPrivate.mockResponse("get", space);

    let returned;
    await act(async () => {
      returned = await result.current({ slug: "design" });
    });

    expect(returned).toEqual(space);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/by-slug");
    expect(call.config?.params).toMatchObject({ slug: "design" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceBySlug());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ slug: "design" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no slug is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceBySlug());

    await expect(result.current({ slug: "" })).rejects.toThrow(
      "Please pass a slug",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

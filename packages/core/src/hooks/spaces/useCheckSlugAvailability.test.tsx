import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useCheckSlugAvailability from "./useCheckSlugAvailability";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCheckSlugAvailability", () => {
  it("checks whether a slug is available", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckSlugAvailability(),
    );

    axiosPrivate.mockResponse("get", { available: true });

    let returned: boolean | undefined;
    await act(async () => {
      returned = await result.current({ slug: "design" });
    });

    expect(returned).toBe(true);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/check-slug?slug=design");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckSlugAvailability(),
    );

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ slug: "design" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no slug is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useCheckSlugAvailability(),
    );

    await expect(result.current({ slug: "" })).rejects.toThrow(
      "Please specify a slug",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useCheckSlugAvailability(),
      { projectId: "" },
    );

    await expect(result.current({ slug: "design" })).rejects.toThrow(
      "No project specified",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

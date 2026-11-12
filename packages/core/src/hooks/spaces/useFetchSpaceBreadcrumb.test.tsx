import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchSpaceBreadcrumb from "./useFetchSpaceBreadcrumb";
import type { SpaceBreadcrumbEntry } from "../../interfaces/SpaceBreadcrumb";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchSpaceBreadcrumb", () => {
  it("returns the breadcrumb trail for a space as an array", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchSpaceBreadcrumb(),
    );

    const breadcrumb: SpaceBreadcrumbEntry[] = [
        { hidden: true },
        {
          id: "space-1",
          shortId: "child",
          name: "Child",
          slug: "child",
          avatarFileId: null,
          visibility: "public",
          parentSpaceId: "root-space",
          depth: 1,
          hidden: false,
        },
    ];
    axiosPrivate.mockResponse("get", { breadcrumb, depth: 1 });

    let returned: SpaceBreadcrumbEntry[] | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual(breadcrumb);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1/breadcrumb");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchSpaceBreadcrumb(),
    );

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useFetchSpaceBreadcrumb(),
    );

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

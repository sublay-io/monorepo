import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpaceDetailed } from "../../test-utils";
import useFetchSpaceByShortId from "./useFetchSpaceByShortId";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchSpaceByShortId", () => {
  it("fetches a space by short ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceByShortId());

    const space = makeSpaceDetailed({ shortId: "short-1" });
    axiosPrivate.mockResponse("get", space);

    let returned;
    await act(async () => {
      returned = await result.current({ shortId: "short-1" });
    });

    expect(returned).toEqual(space);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/by-short-id");
    expect(call.config?.params).toMatchObject({ shortId: "short-1" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceByShortId());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ shortId: "short-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no short ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpaceByShortId());

    await expect(result.current({ shortId: "" })).rejects.toThrow(
      "Please pass a shortId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

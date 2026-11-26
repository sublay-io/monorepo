import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeSpaceDetailed } from "../../test-utils";
import useFetchSpace from "./useFetchSpace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchSpace", () => {
  it("fetches a space by ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpace());

    const space = makeSpaceDetailed();
    axiosPrivate.mockResponse("get", space);

    let returned;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual(space);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/spaces/space-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpace());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchSpace());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

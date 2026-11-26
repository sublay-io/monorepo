import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useLeaveSpace from "./useLeaveSpace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useLeaveSpace", () => {
  it("leaves a space and resolves with nothing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    axiosPrivate.mockResponse("delete", "", 204);

    let returned: unknown = "unset";
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toBeUndefined();

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/spaces/space-1/members/me");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

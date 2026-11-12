import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeMemberPermissions } from "../../test-utils";
import useLeaveSpace from "./useLeaveSpace";

afterEach(() => {
  resetAxiosMocks();
});

describe("useLeaveSpace", () => {
  it("leaves a space", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    const response = { message: "Left", memberPermissions: makeMemberPermissions() };
    axiosPrivate.mockResponse("delete", response);

    let returned;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/spaces/space-1/members/me");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useLeaveSpace());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

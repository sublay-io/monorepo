import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useJoinSpace from "./useJoinSpace";
import type { SpaceMember } from "../../interfaces/models/SpaceMember";

afterEach(() => {
  resetAxiosMocks();
});

describe("useJoinSpace", () => {
  it("joins a space and returns the membership record", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useJoinSpace());

    const response: SpaceMember = {
      id: "membership-1",
      spaceId: "space-1",
      userId: "user-1",
      role: "member",
      status: "active",
      joinedAt: "2024-01-01T00:00:00.000Z",
      createdAt: "2024-01-01T00:00:00.000Z",
    };
    axiosPrivate.mockResponse("post", response, 201);

    let returned: SpaceMember | undefined;
    await act(async () => {
      returned = await result.current({ spaceId: "space-1" });
    });

    expect(returned).toEqual(response);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/spaces/space-1/join");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useJoinSpace());

    axiosPrivate.mockError("post", 403, { message: "Banned from this space" });

    await expect(
      result.current({ spaceId: "space-1" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when no space ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useJoinSpace());

    await expect(result.current({ spaceId: "" })).rejects.toThrow(
      "Please pass a spaceId",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

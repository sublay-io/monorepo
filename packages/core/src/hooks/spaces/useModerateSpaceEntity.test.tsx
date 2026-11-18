import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useModerateSpaceEntity from "./useModerateSpaceEntity";

afterEach(() => {
  resetAxiosMocks();
});

describe("useModerateSpaceEntity", () => {
  it("removes an entity with a reason", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceEntity(),
    );

    axiosPrivate.mockResponse("patch", { moderationStatus: "removed" });

    let returned;
    await act(async () => {
      returned = await result.current({
        spaceId: "space-1",
        entityId: "entity-1",
        action: "remove",
        reason: "Violates guidelines",
      });
    });

    expect(returned).toEqual({ moderationStatus: "removed" });

    const [call] = axiosPrivate.calls("patch");
    expect(call.url).toBe("/test-project/spaces/space-1/entities/entity-1/moderation");
    expect(call.body).toEqual({ action: "remove", reason: "Violates guidelines" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceEntity(),
    );

    axiosPrivate.mockError("patch", 403, { message: "Forbidden" });

    await expect(
      result.current({ spaceId: "space-1", entityId: "entity-1", action: "remove" }),
    ).rejects.toMatchObject({ response: { status: 403 } });
  });

  it("throws before making a request when required fields are missing", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useModerateSpaceEntity(),
    );

    await expect(
      result.current({ spaceId: "", entityId: "entity-1", action: "remove" }),
    ).rejects.toThrow("spaceId and entityId are required.");
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });
});

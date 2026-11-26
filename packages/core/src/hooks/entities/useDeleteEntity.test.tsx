import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useDeleteEntity from "./useDeleteEntity";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteEntity", () => {
  it("deletes the entity", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEntity());

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ entityId: "entity-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/entities/entity-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEntity());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ entityId: "entity-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no entity ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEntity());

    await expect(result.current({ entityId: "" })).rejects.toThrow(
      "No entityId provided.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEntity(), {
      projectId: "",
    });

    await expect(result.current({ entityId: "entity-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

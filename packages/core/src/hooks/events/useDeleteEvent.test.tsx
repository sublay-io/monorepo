import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useDeleteEvent from "./useDeleteEvent";

afterEach(() => {
  resetAxiosMocks();
});

describe("useDeleteEvent", () => {
  it("deletes the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEvent());

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current({ eventId: "event-1" });
    });

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEvent());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ status: 500 });
  });

  it("throws before making a request when no event ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEvent());

    await expect(result.current({ eventId: "" })).rejects.toThrow(
      "No eventId provided.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useDeleteEvent(), {
      projectId: "",
    });

    await expect(result.current({ eventId: "event-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

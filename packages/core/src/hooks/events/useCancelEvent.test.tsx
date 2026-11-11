import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useCancelEvent from "./useCancelEvent";
import type { CancelEventResponse } from "../../interfaces/models/Event";

afterEach(() => {
  resetAxiosMocks();
});

describe("useCancelEvent", () => {
  it("cancels the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCancelEvent());

    const event = makeEvent({ status: "cancelled" });
    axiosPrivate.mockResponse("post", event);

    let returned: CancelEventResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/cancel");
  });

  it("returns the short body when the caller can no longer see the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCancelEvent());

    const short = { id: "event-1", status: "cancelled" as const };
    axiosPrivate.mockResponse("post", short);

    let returned: CancelEventResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1" });
    });

    expect(returned).toEqual(short);
    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/cancel");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCancelEvent());

    axiosPrivate.mockError("post", 500, { message: "Internal error" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when no event ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCancelEvent());

    await expect(result.current({ eventId: "" })).rejects.toThrow(
      "No eventId provided.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useCancelEvent(), {
      projectId: "",
    });

    await expect(result.current({ eventId: "event-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useSetRsvp from "./useSetRsvp";

afterEach(() => {
  resetAxiosMocks();
});

describe("useSetRsvp", () => {
  it("sets an RSVP status on the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSetRsvp());

    const event = makeEvent({ userRsvp: "going" });
    axiosPrivate.mockResponse("post", event);

    let returned: typeof event | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", status: "going" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/rsvp");
    expect(call.body).toEqual({ status: "going" });
  });

  it("rejects when the server returns an error response (e.g. RSVP closed)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSetRsvp());

    axiosPrivate.mockError("post", 400, { message: "RSVPs are closed" });

    await expect(
      result.current({ eventId: "event-1", status: "going" }),
    ).rejects.toMatchObject({ status: 400 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useSetRsvp(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", status: "going" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

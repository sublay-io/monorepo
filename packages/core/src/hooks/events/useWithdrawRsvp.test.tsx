import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useWithdrawRsvp from "./useWithdrawRsvp";
import type { WithdrawRsvpResponse } from "../../interfaces/models/Event";

afterEach(() => {
  resetAxiosMocks();
});

describe("useWithdrawRsvp", () => {
  it("withdraws the RSVP from the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useWithdrawRsvp());

    const event = makeEvent({ userRsvp: null });
    axiosPrivate.mockResponse("delete", event);

    let returned: WithdrawRsvpResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1/rsvp");
  });

  it("returns the short body when the caller can no longer see the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useWithdrawRsvp());

    const short = { id: "event-1", userRsvp: null };
    axiosPrivate.mockResponse("delete", short);

    let returned: WithdrawRsvpResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1" });
    });

    expect(returned).toEqual(short);
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1/rsvp");
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useWithdrawRsvp());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useWithdrawRsvp(), {
      projectId: "",
    });

    await expect(result.current({ eventId: "event-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

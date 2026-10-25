import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useRemoveInvite from "./useRemoveInvite";

afterEach(() => {
  resetAxiosMocks();
});

describe("useRemoveInvite", () => {
  it("removes an invitee from the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveInvite());

    const event = makeEvent();
    axiosPrivate.mockResponse("delete", event);

    let returned: typeof event | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", userId: "user-2" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1/invites/user-2");
    expect(call.config?.data).toBeUndefined();
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveInvite());

    axiosPrivate.mockError("delete", 500, { message: "Internal error" });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toMatchObject({ response: { status: 500 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveInvite(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

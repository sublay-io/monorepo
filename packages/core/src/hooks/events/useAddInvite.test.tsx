import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useAddInvite from "./useAddInvite";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAddInvite", () => {
  it("invites a user to the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddInvite());

    const event = makeEvent();
    axiosPrivate.mockResponse("post", event);

    let returned: typeof event | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", userId: "user-2" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/invites");
    expect(call.body).toEqual({ userId: "user-2" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddInvite());

    axiosPrivate.mockError("post", 403, { message: "Forbidden" });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddInvite(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

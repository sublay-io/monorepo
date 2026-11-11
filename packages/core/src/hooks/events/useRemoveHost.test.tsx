import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useRemoveHost from "./useRemoveHost";
import type { RemoveHostResponse } from "../../interfaces/models/Event";

afterEach(() => {
  resetAxiosMocks();
});

describe("useRemoveHost", () => {
  it("removes a host from the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveHost());

    const event = makeEvent({ hostIds: ["user-1"] });
    axiosPrivate.mockResponse("delete", event);

    let returned: RemoveHostResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", userId: "user-2" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1/hosts/user-2");
    expect(call.config?.data).toBeUndefined();
  });

  it("returns the short body after stepping down from an event the caller can no longer see", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveHost());

    const short = { id: "event-1" };
    axiosPrivate.mockResponse("delete", short);

    let returned: RemoveHostResponse | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", userId: "user-2" });
    });

    expect(returned).toEqual(short);
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1/hosts/user-2");
  });

  it("rejects when the server returns an error response (e.g. last remaining host)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveHost());

    axiosPrivate.mockError("delete", 400, { message: "Cannot remove the last host" });

    await expect(
      result.current({ eventId: "event-1", userId: "user-1" }),
    ).rejects.toMatchObject({ response: { status: 400 } });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useRemoveHost(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("delete")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useAddHost from "./useAddHost";

afterEach(() => {
  resetAxiosMocks();
});

describe("useAddHost", () => {
  it("grants host on the event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddHost());

    const event = makeEvent({ hostIds: ["user-1", "user-2"] });
    axiosPrivate.mockResponse("post", event);

    let returned: typeof event | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", userId: "user-2" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/hosts");
    expect(call.body).toEqual({ userId: "user-2" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddHost());

    axiosPrivate.mockError("post", 403, { message: "Forbidden" });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useAddHost(), {
      projectId: "",
    });

    await expect(
      result.current({ eventId: "event-1", userId: "user-2" }),
    ).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("post")).toHaveLength(0);
  });
});

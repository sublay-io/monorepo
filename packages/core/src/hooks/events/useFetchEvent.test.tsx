import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useFetchEvent from "./useFetchEvent";

afterEach(() => {
  resetAxiosMocks();
});

describe("useFetchEvent", () => {
  it("fetches an event by ID", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEvent());

    const event = makeEvent();
    axiosPrivate.mockResponse("get", event);

    let returned: typeof event | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1" });
    });

    expect(returned).toEqual(event);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/events/event-1");
  });

  it("joins an include array into a comma-separated param", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEvent());

    axiosPrivate.mockResponse("get", makeEvent());

    await act(async () => {
      await result.current({ eventId: "event-1", include: ["user", "space"] });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ include: "user,space" });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEvent());

    axiosPrivate.mockError("get", 404, { message: "Not found" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ status: 404 });
  });

  it("throws before making a request when no event ID is passed", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEvent());

    await expect(result.current({ eventId: "" })).rejects.toThrow(
      "Please pass an eventId",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

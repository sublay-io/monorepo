import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks } from "../../test-utils";
import useFetchEventRsvps from "./useFetchEventRsvps";
import type { EventRsvp } from "../../interfaces/models/Event";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";

afterEach(() => {
  resetAxiosMocks();
});

function makeRsvp(overrides: Partial<EventRsvp> = {}): EventRsvp {
  return {
    id: "rsvp-1",
    eventId: "event-1",
    userId: "user-1",
    status: "going",
    createdAt: "2024-01-01T00:00:00.000Z",
    updatedAt: "2024-01-01T00:00:00.000Z",
    ...overrides,
  };
}

function makePage(rsvps: EventRsvp[]): PaginatedResponse<EventRsvp> {
  return {
    data: rsvps,
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: rsvps.length, hasMore: false },
  };
}

describe("useFetchEventRsvps", () => {
  it("fetches the named RSVP list for an event", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEventRsvps());

    const page = makePage([makeRsvp()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<EventRsvp> | undefined;
    await act(async () => {
      returned = await result.current({ eventId: "event-1", page: 1, limit: 10 });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/events/event-1/rsvps");
    expect(call.config?.params).toMatchObject({ page: 1, limit: 10 });
  });

  it("joins a status array into a comma-separated param", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEventRsvps());

    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({ eventId: "event-1", status: ["going", "maybe"] });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({ status: "going,maybe" });
  });

  it("rejects when the server returns an error response (e.g. guest list hidden)", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchEventRsvps());

    axiosPrivate.mockError("get", 403, { message: "Forbidden" });

    await expect(
      result.current({ eventId: "event-1" }),
    ).rejects.toMatchObject({ status: 403 });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchEventRsvps(),
      { projectId: "" },
    );

    await expect(result.current({ eventId: "event-1" })).rejects.toThrow(
      "No projectId available.",
    );
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

import { describe, it, expect, afterEach } from "vitest";
import { act } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useFetchManyEvents from "./useFetchManyEvents";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Event } from "../../interfaces/models/Event";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(events: Event[]): PaginatedResponse<Event> {
  return {
    data: events,
    pagination: { page: 1, pageSize: 10, totalPages: 1, totalItems: events.length, hasMore: false },
  };
}

describe("useFetchManyEvents", () => {
  it("fetches a page of events with the expected params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEvents());

    const page = makePage([makeEvent()]);
    axiosPrivate.mockResponse("get", page);

    let returned: PaginatedResponse<Event> | undefined;
    await act(async () => {
      returned = await result.current({ page: 1, sortBy: "startTime", sortDir: "asc" });
    });

    expect(returned).toEqual(page);

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/events");
    expect(call.config?.params).toMatchObject({
      page: 1,
      sortBy: "startTime",
      sortDir: "asc",
    });
  });

  it("joins a myRsvp array and serializes titleFilters into bracket-notation params", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEvents());

    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({
        myRsvp: ["going", "maybe"],
        titleFilters: { hasTitle: "true", includes: "launch" },
      });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({
      myRsvp: "going,maybe",
      "titleFilters[hasTitle]": "true",
      "titleFilters[includes]": "launch",
    });
  });

  it("sends Date startsAfter / startsBefore as ISO strings", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEvents());
    axiosPrivate.mockResponse("get", makePage([]));

    await act(async () => {
      await result.current({
        startsAfter: new Date("2024-06-01T00:00:00.000Z"),
        startsBefore: "2024-07-01T00:00:00.000Z",
      });
    });

    const [call] = axiosPrivate.calls("get");
    expect(call.config?.params).toMatchObject({
      startsAfter: "2024-06-01T00:00:00.000Z",
      startsBefore: "2024-07-01T00:00:00.000Z",
    });
  });

  it("rejects when the server returns an error response", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useFetchManyEvents());

    axiosPrivate.mockError("get", 500, { message: "Internal error" });

    await expect(result.current()).rejects.toMatchObject({
      status: 500,
    });
  });

  it("throws before making a request when there is no project", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEvents(),
      { projectId: "" },
    );

    await expect(result.current()).rejects.toThrow("No projectId available.");
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });
});

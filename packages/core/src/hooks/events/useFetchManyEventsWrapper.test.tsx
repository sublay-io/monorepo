import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useFetchManyEventsWrapper from "./useFetchManyEventsWrapper";
import type { PaginatedResponse } from "../../interfaces/PaginatedResponse";
import type { Event } from "../../interfaces/models/Event";

afterEach(() => {
  resetAxiosMocks();
});

function makePage(events: Event[], hasMore: boolean): PaginatedResponse<Event> {
  return {
    data: events,
    pagination: {
      page: 1,
      pageSize: 10,
      totalPages: hasMore ? 2 : 1,
      totalItems: events.length,
      hasMore,
    },
  };
}

describe("useFetchManyEventsWrapper", () => {
  it("fetches the first page on mount and loads more on demand", async () => {
    const firstEvent = makeEvent({ id: "event-1" });
    const secondEvent = makeEvent({ id: "event-2" });

    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEventsWrapper({}),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([firstEvent], true)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([firstEvent]);
    expect(result.current.hasMore).toBe(true);

    axiosPrivate.mockResponse("get", makePage([secondEvent], false));

    act(() => {
      result.current.loadMore();
    });

    await waitFor(() => expect(result.current.hasMore).toBe(false));
    expect(result.current.events).toEqual([firstEvent, secondEvent]);

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[0].config?.params).toMatchObject({ page: 1 });
    expect(calls[1].config?.params).toMatchObject({ page: 2 });
  });

  it("resets to page 1 and refetches when the sort options change", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEventsWrapper({}),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEvent()], false)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([], false));

    act(() => {
      result.current.setSortBy("going");
    });

    await waitFor(() => expect(result.current.sortBy).toBe("going"));
    await waitFor(() => expect(result.current.loading).toBe(false));

    const calls = axiosPrivate.calls("get");
    const lastCall = calls[calls.length - 1];
    expect(lastCall.config?.params).toMatchObject({ page: 1, sortBy: "going" });
    // No direction by default: the server uses the sort's natural one (most
    // going first).
    expect(result.current.sortDir).toBeNull();
    expect(lastCall.config?.params?.sortDir).toBeUndefined();

    axiosPrivate.mockResponse("get", makePage([], false));
    act(() => {
      result.current.setSortDir("asc");
    });
    await waitFor(() => expect(result.current.sortDir).toBe("asc"));
    await waitFor(() => {
      const all = axiosPrivate.calls("get");
      expect(all[all.length - 1].config?.params).toMatchObject({ sortBy: "going", sortDir: "asc" });
    });
  });

  it("refresh() re-runs the query from page 1", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(
      () => useFetchManyEventsWrapper({}),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockResponse("get", makePage([makeEvent({ id: "event-1" })], true)),
      },
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    axiosPrivate.mockResponse("get", makePage([makeEvent({ id: "event-2" })], false));

    act(() => {
      result.current.refresh();
    });

    await waitFor(() =>
      expect(result.current.events.map((e) => e.id)).toEqual(["event-2"]),
    );
  });

  it("stops loading without throwing when the request fails", async () => {
    const { result } = renderHookWithAxios(() => useFetchManyEventsWrapper({}), {
      beforeRender: ({ axiosPrivate }) =>
        axiosPrivate.mockError("get", 500, { message: "Internal error" }),
    });

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.events).toEqual([]);
  });
});

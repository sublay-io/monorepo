import { describe, it, expect, afterEach } from "vitest";
import { act, waitFor } from "@testing-library/react";

import { renderHookWithAxios, resetAxiosMocks, makeEvent } from "../../test-utils";
import useEventData, { type UseEventDataProps } from "./useEventData";

afterEach(() => {
  resetAxiosMocks();
});

describe("useEventData", () => {
  it("resolves an event by eventId and caches it for the same ID on a later render", async () => {
    const eventOne = makeEvent({ id: "event-1" });
    const eventTwo = makeEvent({ id: "event-2" });

    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEventDataProps) => useEventData(props),
      {
        initialProps: { eventId: "event-1" } as UseEventDataProps,
        beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", eventOne),
      },
    );

    await waitFor(() => expect(result.current.event).toEqual(eventOne));

    axiosPrivate.mockResponse("get", eventTwo);
    rerender({ eventId: "event-2" } as UseEventDataProps);
    await waitFor(() => expect(result.current.event).toEqual(eventTwo));

    rerender({ eventId: "event-1" } as UseEventDataProps);
    await waitFor(() => expect(result.current.event).toEqual(eventOne));

    expect(axiosPrivate.calls("get")).toHaveLength(2);
  });

  it("uses a directly-provided event prop without fetching", () => {
    const event = makeEvent({ id: "event-1" });

    const { result, axiosPrivate } = renderHookWithAxios(() =>
      useEventData({ event }),
    );

    expect(result.current.event).toEqual(event);
    expect(axiosPrivate.calls("get")).toHaveLength(0);
  });

  it("does not throw and leaves event unset when the fetch fails", async () => {
    const { result } = renderHookWithAxios(
      () => useEventData({ eventId: "event-1" }),
      {
        beforeRender: ({ axiosPrivate }) =>
          axiosPrivate.mockError("get", 500, { message: "Internal error" }),
      },
    );

    await waitFor(() => expect(result.current.event).toBeUndefined());
  });

  it("updates the event via updateEvent", async () => {
    const event = makeEvent({ id: "event-1", title: "Old" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({ event }));

    const updated = { ...event, title: "New" };
    axiosPrivate.mockResponse("patch", updated);

    let returned;
    await act(async () => {
      returned = await result.current.updateEvent({ update: { title: "New" } });
    });

    expect(returned).toEqual(updated);
    expect(result.current.event).toEqual(updated);
  });

  it("no-ops updateEvent when there is no event yet", async () => {
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({} as any));

    let returned;
    await act(async () => {
      returned = await result.current.updateEvent({ update: { title: "New" } });
    });

    expect(returned).toBeUndefined();
    expect(axiosPrivate.calls("patch")).toHaveLength(0);
  });

  it("deletes the event via deleteEvent and clears local state", async () => {
    const event = makeEvent({ id: "event-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({ event }));

    axiosPrivate.mockResponse("delete", undefined, 204);

    await act(async () => {
      await result.current.deleteEvent();
    });

    expect(result.current.event).toBeUndefined();
    const [call] = axiosPrivate.calls("delete");
    expect(call.url).toBe("/test-project/events/event-1");
  });

  it("cancels the event via cancelEvent", async () => {
    const event = makeEvent({ id: "event-1", status: "active" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({ event }));

    const cancelled = { ...event, status: "cancelled" as const };
    axiosPrivate.mockResponse("post", cancelled);

    let returned;
    await act(async () => {
      returned = await result.current.cancelEvent();
    });

    expect(returned).toEqual(cancelled);
    expect(result.current.event).toEqual(cancelled);
  });

  it("sets and withdraws an RSVP", async () => {
    const event = makeEvent({ id: "event-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({ event }));

    const goingEvent = { ...event, userRsvp: "going" as const };
    axiosPrivate.mockResponse("post", goingEvent);

    await act(async () => {
      await result.current.setRsvp("going");
    });
    expect(result.current.event).toEqual(goingEvent);

    const withdrawnEvent = { ...event, userRsvp: null };
    axiosPrivate.mockResponse("delete", withdrawnEvent);

    await act(async () => {
      await result.current.withdrawRsvp();
    });
    expect(result.current.event).toEqual(withdrawnEvent);
  });

  it("does not throw when updateEvent's request fails", async () => {
    const event = makeEvent({ id: "event-1" });
    const { result, axiosPrivate } = renderHookWithAxios(() => useEventData({ event }));

    axiosPrivate.mockError("patch", 500, { message: "Internal error" });

    await expect(
      act(async () => {
        await result.current.updateEvent({ update: { title: "New" } });
      }),
    ).resolves.not.toThrow();
  });

  // REGRESSION: an inline `include` array is a fresh reference every render.
  // Held raw in the fetch effect's deps, every re-render while the fetch was in
  // flight started another one. The effect depends on a flattened key instead.
  it("fetches once when re-rendered with an equal inline include array mid-fetch", async () => {
    const event = makeEvent({ id: "event-1" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      () => useEventData({ eventId: "event-1", include: ["user", "space"] }),
      {
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", event);
          }
        },
      },
    );

    // Re-render synchronously, before the first fetch resolves.
    for (let i = 0; i < 5; i += 1) rerender();
    await waitFor(() => expect(result.current.event).toEqual(event));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(1);
    expect(calls[0].config?.params).toMatchObject({ include: "user,space" });
  });

  it("fetches with the changed include when include changes before the event loads", async () => {
    const event = makeEvent({ id: "event-1" });
    const { result, rerender, axiosPrivate } = renderHookWithAxios(
      (props: UseEventDataProps) => useEventData(props),
      {
        initialProps: { eventId: "event-1", include: ["user"] } as UseEventDataProps,
        beforeRender: ({ axiosPrivate }) => {
          for (let i = 0; i < 10; i += 1) {
            axiosPrivate.mockResponse("get", event);
          }
        },
      },
    );

    rerender({ eventId: "event-1", include: ["user", "files"] } as UseEventDataProps);
    await waitFor(() => expect(result.current.event).toEqual(event));
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 0));
    });

    const calls = axiosPrivate.calls("get");
    expect(calls).toHaveLength(2);
    expect(calls[1].config?.params).toMatchObject({ include: "user,files" });
  });

  // REGRESSION (#233): an inline `event` object is a fresh reference every
  // render. Held raw in the sync effect's deps, any re-render set state, which
  // re-rendered, which set state again: an endless loop. (Mount alone didn't
  // loop: the first sync sets the same object the state started with.)
  it("does not loop when re-rendered with an inline event prop", async () => {
    const base = makeEvent({ id: "event-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(() => {
      renders += 1;
      // The old code looped synchronously; fail instead of hanging.
      if (renders > 50) throw new Error("render loop");
      return useEventData({ event: { ...base } } as UseEventDataProps);
    });

    for (let i = 0; i < 3; i += 1) rerender();
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });

    expect(renders).toBeLessThan(10);
    expect(result.current.event).toEqual(base);
  });

  it("still takes an event prop whose content really changes", async () => {
    const base = makeEvent({ id: "event-1" });
    let renders = 0;
    const { result, rerender } = renderHookWithAxios(
      (props: { value: string }) => {
        renders += 1;
        if (renders > 50) throw new Error("render loop");
        return useEventData({ event: { ...base, title: props.value } } as UseEventDataProps);
      },
      { initialProps: { value: "first" } },
    );

    rerender({ value: "second" });
    await waitFor(() => expect(result.current.event?.title).toBe("second"));
  });
});

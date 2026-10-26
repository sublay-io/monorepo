import React, { useContext } from "react";
import { describe, it, expect, afterEach } from "vitest";
import { render, renderHook, act, waitFor } from "@testing-library/react";

import { resetAxiosMocks, makeEvent } from "../test-utils";
import { makeProvidersWrapper } from "./testHelpers";
import { EventProvider, EventContext } from "./event-context";

afterEach(() => {
  resetAxiosMocks();
});

describe("EventProvider", () => {
  it("exposes a directly-provided event via context, with no fetch", () => {
    const event = makeEvent({ id: "event-1" });
    const { Wrapper } = makeProvidersWrapper();

    const { result } = renderHook(() => useContext(EventContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <EventProvider event={event}>{children}</EventProvider>
        </Wrapper>
      ),
    });

    expect(result.current.event).toEqual(event);
    expect(typeof result.current.setRsvp).toBe("function");
    expect(typeof result.current.withdrawRsvp).toBe("function");
  });

  it("fetches the event by eventId and exposes the resolved event via context", async () => {
    const event = makeEvent({ id: "event-1" });
    const { Wrapper, axiosPrivate } = makeProvidersWrapper({
      beforeRender: ({ axiosPrivate }) => axiosPrivate.mockResponse("get", event),
    });

    const { result } = renderHook(() => useContext(EventContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <EventProvider eventId="event-1">{children}</EventProvider>
        </Wrapper>
      ),
    });

    await waitFor(() => expect(result.current.event).toEqual(event));

    const [call] = axiosPrivate.calls("get");
    expect(call.url).toBe("/test-project/events/event-1");
  });

  it("renders nothing when no event-identifying prop is provided", () => {
    const { Wrapper } = makeProvidersWrapper();

    const NoIdentifyingPropsEventProvider = EventProvider as React.FC<{
      children: React.ReactNode;
    }>;
    const { container } = render(
      <Wrapper>
        <NoIdentifyingPropsEventProvider>
          <div data-testid="child" />
        </NoIdentifyingPropsEventProvider>
      </Wrapper>,
    );

    expect(container.querySelector('[data-testid="child"]')).toBeNull();
  });

  it("updates the exposed event when setRsvp is called", async () => {
    const event = makeEvent({ id: "event-1", rsvpCounts: { going: 0, maybe: 0, "not-going": 0 } });
    const { Wrapper, axiosPrivate } = makeProvidersWrapper();

    const { result } = renderHook(() => useContext(EventContext), {
      wrapper: ({ children }) => (
        <Wrapper>
          <EventProvider event={event}>{children}</EventProvider>
        </Wrapper>
      ),
    });

    const updated = { ...event, rsvpCounts: { going: 1, maybe: 0, "not-going": 0 } };
    axiosPrivate.mockResponse("post", updated);

    await act(async () => {
      await result.current.setRsvp!("going");
    });

    expect(result.current.event).toEqual(updated);

    const [call] = axiosPrivate.calls("post");
    expect(call.url).toBe("/test-project/events/event-1/rsvp");
    expect(call.body).toEqual({ status: "going" });
  });
});

import { useCallback, useEffect, useRef, useState } from "react";
import { useStableObject } from "../useStableObject";

import useFetchEvent from "./useFetchEvent";
import useUpdateEvent, { UpdateEventProps } from "./useUpdateEvent";
import useDeleteEvent from "./useDeleteEvent";
import useCancelEvent from "./useCancelEvent";
import useSetRsvp from "./useSetRsvp";
import useWithdrawRsvp from "./useWithdrawRsvp";

import {
  CancelEventResponse,
  Event,
  EventInclude,
  EventIncludeParam,
  RsvpStatus,
  WithdrawRsvpResponse,
} from "../../interfaces/models/Event";
import { handleError } from "../../utils/handleError";

// A short body (`{ id, status }`, `{ id, userRsvp }`) answers a caller who
// can no longer see the event; a full event always carries its `shortId`.
function isFullEvent(
  body: Event | CancelEventResponse | WithdrawRsvpResponse
): body is Event {
  return "shortId" in body;
}

// Mutation responses carry only `user` and `userRsvp` of the includes, so
// they're merged onto the current event rather than replacing it: the
// `space` / `files` the hook fetched stay, and so do the owner's
// `avatarFile` / `bannerFile` (`user` is merged one level deep).
function mergeEventResponse(
  current: Event | null | undefined,
  response: Event
): Event {
  if (!current || current.id !== response.id) return response;
  const merged: Event = { ...current, ...response };
  if (current.user && response.user) {
    merged.user = { ...current.user, ...response.user };
  }
  return merged;
}

export type UseEventDataProps =
  | {
      event: Event;
      eventId?: undefined;
      include?: undefined;
    }
  | {
      event?: undefined;
      eventId: string;
      include?: EventIncludeParam;
    };

export interface UseEventDataValues {
  event: Event | null | undefined;
  setEvent: React.Dispatch<React.SetStateAction<Event | null | undefined>>;
  updateEvent(
    props: Pick<UpdateEventProps, "update">
  ): Promise<Event | undefined>;
  deleteEvent: () => Promise<void>;
  cancelEvent: () => Promise<CancelEventResponse | undefined>;
  setRsvp: (status: RsvpStatus) => Promise<Event | undefined>;
  withdrawRsvp: () => Promise<WithdrawRsvpResponse | undefined>;
}

function useEventData(props: UseEventDataProps): UseEventDataValues {
  const eventProp = "event" in props ? props.event : undefined;
  const eventId = "eventId" in props ? props.eventId : undefined;
  const include = "include" in props ? props.include : undefined;
  // Flattened to a string for the fetch effect's deps: an inline array is a
  // fresh reference every render and would re-run the effect each time.
  const includeKey = Array.isArray(include) ? include.join(",") : include;

  const [event, setEvent] = useState<Event | undefined | null>(eventProp);

  // Cache fetched events keyed by id.
  const eventCache = useRef<Record<string, Event>>({});
  // Ids of events deleted here, or answered with a short body (the caller
  // can no longer see them). The fetch effect shows `null` for them instead of
  // refilling them from the cache or the server.
  const goneIds = useRef<Set<string>>(new Set());

  const fetchEvent = useFetchEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();
  const setRsvp = useSetRsvp();
  const withdrawRsvp = useWithdrawRsvp();

  // Merge a full-event response onto the current state and keep the cache in
  // step, so switching away and back shows it.
  const applyEvent = useCallback(
    (response: Event) => {
      const merged = mergeEventResponse(event, response);
      eventCache.current[merged.id] = merged;
      setEvent(merged);
    },
    [event]
  );

  // The event is gone for this caller (deleted, or no longer visible).
  const markGone = useCallback((id: string) => {
    delete eventCache.current[id];
    goneIds.current.add(id);
    setEvent(null);
  }, []);

  const handleUpdateEvent = useCallback(
    async ({ update }: Pick<UpdateEventProps, "update">) => {
      if (!event) return;
      try {
        const newEvent = await updateEvent({ eventId: event.id, update });
        if (newEvent) applyEvent(newEvent);
        return newEvent;
      } catch (err) {
        handleError(err, "Failed to update event");
      }
    },
    [event, updateEvent, applyEvent]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!event) return;
    try {
      await deleteEvent({ eventId: event.id });
      markGone(event.id);
    } catch (err) {
      handleError(err, "Failed to delete event");
    }
  }, [event, deleteEvent, markGone]);

  const handleCancelEvent = useCallback(async () => {
    if (!event) return;
    try {
      const response = await cancelEvent({ eventId: event.id });
      if (response) {
        if (isFullEvent(response)) applyEvent(response);
        else markGone(event.id);
      }
      return response;
    } catch (err) {
      handleError(err, "Failed to cancel event");
    }
  }, [event, cancelEvent, applyEvent, markGone]);

  const handleSetRsvp = useCallback(
    async (status: RsvpStatus) => {
      if (!event) return;
      try {
        const newEvent = await setRsvp({ eventId: event.id, status });
        if (newEvent) applyEvent(newEvent);
        return newEvent;
      } catch (err) {
        handleError(err, "Failed to set RSVP");
      }
    },
    [event, setRsvp, applyEvent]
  );

  const handleWithdrawRsvp = useCallback(async () => {
    if (!event) return;
    try {
      const response = await withdrawRsvp({ eventId: event.id });
      if (response) {
        if (isFullEvent(response)) applyEvent(response);
        else markGone(event.id);
      }
      return response;
    } catch (err) {
      handleError(err, "Failed to withdraw RSVP");
    }
  }, [event, withdrawRsvp, applyEvent, markGone]);

  useEffect(() => {
    const handleFetchEvent = async () => {
      if (!eventId) return;
      if (event && event.id === eventId) return;

      // Gone (deleted or no longer visible): show nothing, never a refetch or
      // the previous id's event.
      if (goneIds.current.has(eventId)) {
        if (event !== null) setEvent(null);
        return;
      }

      if (eventCache.current[eventId]) {
        setEvent(eventCache.current[eventId]);
        return;
      }

      try {
        const fetchedEvent = await fetchEvent({
          eventId,
          include: includeKey
            ? (includeKey.split(",") as EventInclude[])
            : undefined,
        });
        if (fetchedEvent) {
          eventCache.current[eventId] = fetchedEvent;
          setEvent(fetchedEvent);
        } else {
          setEvent(null);
        }
      } catch (err) {
        handleError(err, "Failed to fetch event");
      }
    };

    handleFetchEvent();
  }, [fetchEvent, eventId, includeKey, event]);

  // Stable while its content is the same, so an object created again on every
  // render (an inline `event={{ ... }}`) isn't a change.
  const stableEventProp = useStableObject(eventProp);
  useEffect(() => {
    if (stableEventProp) setEvent(stableEventProp);
  }, [stableEventProp]);

  return {
    event,
    setEvent,
    updateEvent: handleUpdateEvent,
    deleteEvent: handleDeleteEvent,
    cancelEvent: handleCancelEvent,
    setRsvp: handleSetRsvp,
    withdrawRsvp: handleWithdrawRsvp,
  };
}

export default useEventData;

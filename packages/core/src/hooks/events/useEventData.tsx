import { useCallback, useEffect, useRef, useState } from "react";

import useFetchEvent from "./useFetchEvent";
import useUpdateEvent, { UpdateEventProps } from "./useUpdateEvent";
import useDeleteEvent from "./useDeleteEvent";
import useCancelEvent from "./useCancelEvent";
import useSetRsvp from "./useSetRsvp";
import useWithdrawRsvp from "./useWithdrawRsvp";

import {
  Event,
  EventInclude,
  EventIncludeParam,
  RsvpStatus,
} from "../../interfaces/models/Event";
import { handleError } from "../../utils/handleError";

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
  cancelEvent: () => Promise<Event | undefined>;
  setRsvp: (status: RsvpStatus) => Promise<Event | undefined>;
  withdrawRsvp: () => Promise<Event | undefined>;
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

  const fetchEvent = useFetchEvent();
  const updateEvent = useUpdateEvent();
  const deleteEvent = useDeleteEvent();
  const cancelEvent = useCancelEvent();
  const setRsvp = useSetRsvp();
  const withdrawRsvp = useWithdrawRsvp();

  const handleUpdateEvent = useCallback(
    async ({ update }: Pick<UpdateEventProps, "update">) => {
      if (!event) return;
      try {
        const newEvent = await updateEvent({ eventId: event.id, update });
        if (newEvent) setEvent(newEvent);
        return newEvent;
      } catch (err) {
        handleError(err, "Failed to update event");
      }
    },
    [event, updateEvent]
  );

  const handleDeleteEvent = useCallback(async () => {
    if (!event) return;
    try {
      await deleteEvent({ eventId: event.id });
      setEvent(undefined);
    } catch (err) {
      handleError(err, "Failed to delete event");
    }
  }, [event, deleteEvent]);

  const handleCancelEvent = useCallback(async () => {
    if (!event) return;
    try {
      const newEvent = await cancelEvent({ eventId: event.id });
      if (newEvent) setEvent(newEvent);
      return newEvent;
    } catch (err) {
      handleError(err, "Failed to cancel event");
    }
  }, [event, cancelEvent]);

  const handleSetRsvp = useCallback(
    async (status: RsvpStatus) => {
      if (!event) return;
      try {
        const newEvent = await setRsvp({ eventId: event.id, status });
        if (newEvent) setEvent(newEvent);
        return newEvent;
      } catch (err) {
        handleError(err, "Failed to set RSVP");
      }
    },
    [event, setRsvp]
  );

  const handleWithdrawRsvp = useCallback(async () => {
    if (!event) return;
    try {
      const newEvent = await withdrawRsvp({ eventId: event.id });
      if (newEvent) setEvent(newEvent);
      return newEvent;
    } catch (err) {
      handleError(err, "Failed to withdraw RSVP");
    }
  }, [event, withdrawRsvp]);

  useEffect(() => {
    const handleFetchEvent = async () => {
      if (!eventId) return;
      if (event && event.id === eventId) return;

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

  useEffect(() => {
    if (eventProp) setEvent(eventProp);
  }, [eventProp]);

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

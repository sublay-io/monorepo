import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Event,
  EventInclude,
  EventIncludeParam,
  EventStatus,
  EventType,
  RsvpStatus,
} from "../../interfaces/models/Event";
import useFetchManyEvents, {
  EventDescriptionFilters,
  EventLocationFilters,
  EventTitleFilters,
} from "./useFetchManyEvents";
import { handleError } from "../../utils/handleError";

type EventSortBy = "startTime" | "going";
type EventSortDir = "asc" | "desc";
type EventTimeWindow = "upcoming" | "ongoing" | "past";

export interface UseFetchManyEventsWrapperProps {
  limit?: number;
  spaceId?: string | null;
  hostId?: string | null;
  type?: EventType | null;
  status?: EventStatus | null;
  timeWindow?: EventTimeWindow | null;
  startsAfter?: string | null;
  startsBefore?: string | null;
  myRsvp?: RsvpStatus | RsvpStatus[] | null;
  locationFilters?: EventLocationFilters | null;
  titleFilters?: EventTitleFilters | null;
  descriptionFilters?: EventDescriptionFilters | null;
  include?: EventIncludeParam;
  defaultSortBy?: EventSortBy;
  /**
   * Left out (null): the sort's natural direction — soonest first for
   * `startTime`, most going first for `going`.
   */
  defaultSortDir?: EventSortDir | null;
}

export interface UseFetchManyEventsWrapperValues {
  events: Event[];
  loading: boolean;
  hasMore: boolean;
  sortBy: EventSortBy;
  /** null: the sort's natural direction. */
  sortDir: EventSortDir | null;
  setSortBy: (newSortBy: EventSortBy) => void;
  setSortDir: (newSortDir: EventSortDir | null) => void;
  loadMore: () => void;
  /** Re-run the query from page 1 (e.g. after creating/cancelling an event). */
  refresh: () => void;
}

function useFetchManyEventsWrapper(
  props: UseFetchManyEventsWrapperProps = {}
): UseFetchManyEventsWrapperValues {
  const {
    limit = 10,
    spaceId,
    hostId,
    type,
    status,
    timeWindow,
    startsAfter,
    startsBefore,
    myRsvp,
    locationFilters,
    titleFilters,
    descriptionFilters,
    include,
    defaultSortBy = "startTime",
    defaultSortDir = null,
  } = props;

  // `include` and `myRsvp` are flattened to the strings the wire carries, and
  // those strings — never the raw values — go into the dep arrays. An inline
  // array is a fresh reference every render; raw in a dep array it re-fires the
  // reset effect on every render, an unbounded request loop.
  const includeKey = Array.isArray(include) ? include.join(",") : include;
  const includeList = useMemo(
    () => (includeKey ? (includeKey.split(",") as EventInclude[]) : undefined),
    [includeKey]
  );
  const myRsvpKey = Array.isArray(myRsvp) ? myRsvp.join(",") : myRsvp;
  const myRsvpList = useMemo(
    () => (myRsvpKey ? (myRsvpKey.split(",") as RsvpStatus[]) : undefined),
    [myRsvpKey]
  );

  const fetchManyEvents = useFetchManyEvents();

  const loading = useRef(true);
  const [loadingState, setLoadingState] = useState(true);

  const hasMore = useRef(true);
  const [hasMoreState, setHasMoreState] = useState(true);

  const [sortBy, setSortBy] = useState<EventSortBy>(defaultSortBy);
  const [sortDir, setSortDir] = useState<EventSortDir | null>(defaultSortDir);
  const [page, setPage] = useState(1);
  const [events, setEvents] = useState<Event[]>([]);

  const buildParams = useCallback(
    (pageArg: number) => ({
      page: pageArg,
      limit,
      sortBy,
      sortDir: sortDir ?? undefined,
      spaceId: spaceId ?? undefined,
      hostId: hostId ?? undefined,
      type: type ?? undefined,
      status: status ?? undefined,
      timeWindow: timeWindow ?? undefined,
      startsAfter: startsAfter ?? undefined,
      startsBefore: startsBefore ?? undefined,
      myRsvp: myRsvpList,
      locationFilters: locationFilters ?? undefined,
      titleFilters: titleFilters ?? undefined,
      descriptionFilters: descriptionFilters ?? undefined,
      include: includeList,
    }),
    [
      limit,
      sortBy,
      sortDir,
      spaceId,
      hostId,
      type,
      status,
      timeWindow,
      startsAfter,
      startsBefore,
      myRsvpList,
      locationFilters,
      titleFilters,
      descriptionFilters,
      includeList,
    ]
  );

  const resetEvents = useCallback(async () => {
    try {
      loading.current = true;
      setLoadingState(true);

      hasMore.current = true;
      setHasMoreState(true);

      setPage(1);

      const response = await fetchManyEvents(buildParams(1));

      if (response) {
        const { data: newEvents, pagination } = response;
        setEvents(newEvents);
        hasMore.current = pagination.hasMore;
        setHasMoreState(pagination.hasMore);
      }
    } catch (err) {
      handleError(err, "Failed to reset events:");
    } finally {
      loading.current = false;
      setLoadingState(false);
    }
  }, [fetchManyEvents, buildParams]);

  const loadMore = () => {
    if (loading.current || !hasMore.current) return;
    setPage((prevPage) => prevPage + 1);
  };

  const refresh = () => {
    resetEvents();
  };

  useEffect(() => {
    resetEvents();
  }, [resetEvents]);

  useEffect(() => {
    const loadMoreEvents = async () => {
      loading.current = true;
      setLoadingState(true);
      try {
        const response = await fetchManyEvents(buildParams(page));

        if (response) {
          const { data: newEvents, pagination } = response;
          setEvents((prevEvents) => [...prevEvents, ...newEvents]);
          hasMore.current = pagination.hasMore;
          setHasMoreState(pagination.hasMore);
        }
      } catch (err) {
        handleError(err, "Loading more events failed:");
      } finally {
        loading.current = false;
        setLoadingState(false);
      }
    };

    // Only load more when the page advances past 1.
    if (page > 1 && hasMore.current && !loading.current) {
      loadMoreEvents();
    }
  }, [page, fetchManyEvents, buildParams]);

  return {
    events,
    loading: loadingState,
    hasMore: hasMoreState,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    loadMore,
    refresh,
  };
}

export default useFetchManyEventsWrapper;

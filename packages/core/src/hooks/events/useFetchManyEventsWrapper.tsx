import { useViewerKey } from "../list/useViewerKey";
import useProject from "../projects/useProject";
import { useState } from "react";
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
import { useListEngine } from "../list/useListEngine";
import { pageNumberPaging } from "../list/paging";

type EventSortBy = "startTime" | "going";
type EventSortDir = "asc" | "desc";
type EventTimeWindow = "upcoming" | "ongoing" | "past";

export interface UseFetchManyEventsWrapperProps {
  limit?: number;
  /** Only this space's events, or `"none"` for events not in any space. `null` or left out: every event. */
  spaceId?: string | "none" | null;
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
  /** The last load failure. Cleared when the next load starts; `loadMore()` retries it. */
  error: Error | null;
  /** Whether `loadMore()` has anything to fetch: a next page, or a load that failed. */
  hasMore: boolean;
  sortBy: EventSortBy;
  /** null: the sort's natural direction. */
  sortDir: EventSortDir | null;
  setSortBy: (newSortBy: EventSortBy) => void;
  setSortDir: (newSortDir: EventSortDir | null) => void;
  /**
   * Load the next page, or retry the load that failed (a failed first page
   * included). Does nothing while loading or when there is nothing more.
   * Never rejects.
   */
  loadMore: () => Promise<void>;
  /**
   * Reload from page 1 with the current filters and sort (e.g. after
   * creating or cancelling an event). Never rejects.
   */
  refetch: () => Promise<void>;
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

  // `include` and `myRsvp` are flattened to the strings the wire carries. An
  // inline array is a fresh reference every render; only the strings go into
  // the reset key.
  const includeKey = Array.isArray(include) ? include.join(",") : include;
  const myRsvpKey = Array.isArray(myRsvp) ? myRsvp.join(",") : myRsvp;

  const fetchManyEvents = useFetchManyEvents();

  const [sortBy, setSortBy] = useState<EventSortBy>(defaultSortBy);
  const [sortDir, setSortDir] = useState<EventSortDir | null>(defaultSortDir);

  // A different project is a different list, and so is a different viewer
  // (results carry the viewer's reactions, follows, blocks).
  const { projectId } = useProject();
  const viewerId = useViewerKey();

  // The one request builder for every page: a param can't be sent with page 1
  // and left off page 2.
  const buildParams = (page: number) => ({
    page,
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
    myRsvp: myRsvpKey ? (myRsvpKey.split(",") as RsvpStatus[]) : undefined,
    locationFilters: locationFilters ?? undefined,
    titleFilters: titleFilters ?? undefined,
    descriptionFilters: descriptionFilters ?? undefined,
    include: includeKey ? (includeKey.split(",") as EventInclude[]) : undefined,
  });

  // Serialized, so an inline filter object or array (a fresh reference every
  // render) doesn't restart the list.
  const resetKey = JSON.stringify([projectId, viewerId, buildParams(1)]);

  const list = useListEngine<Event, number>({
    enabled: true,
    resetKey,
    fetchPage: pageNumberPaging((page) => fetchManyEvents(buildParams(page))),
    errorLabel: "Failed to fetch events:",
  });

  return {
    events: list.items,
    loading: list.loading,
    error: list.error,
    hasMore: list.hasMore,
    sortBy,
    sortDir,
    setSortBy,
    setSortDir,
    loadMore: list.loadMore,
    refetch: list.refetch,
  };
}

export default useFetchManyEventsWrapper;

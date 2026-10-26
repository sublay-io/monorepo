import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  Event,
  EventType,
  EventStatus,
  EventIncludeParam,
  RsvpStatus,
} from "../../interfaces/Event";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";

export interface EventTextFilters {
  hasTitle?: "true" | "false";
  includes?: string | string[];
  doesNotInclude?: string | string[];
}

export interface EventDescriptionFilters {
  hasDescription?: "true" | "false";
  includes?: string | string[];
  doesNotInclude?: string | string[];
}

export interface EventLocationFilters {
  latitude: string;
  longitude: string;
  radius: string;
}

export interface FetchManyEventsProps {
  // Pagination
  page?: number;
  limit?: number; // capped at 100 server-side

  // Sorting
  sortBy?: "startTime" | "going";
  sortDir?: "asc" | "desc";

  // Time filtering: derived window OR explicit range
  timeWindow?: "upcoming" | "ongoing" | "past";
  startsAfter?: string; // ISO datetime
  startsBefore?: string; // ISO datetime

  // Scope / attribute filters
  /** Only this space's events, or `"none"` for events not in any space. Left out: every event. */
  spaceId?: string | "none";
  hostId?: string;
  type?: EventType;
  status?: EventStatus; // defaults to "active" server-side

  /**
   * RSVP statuses the logged-in user RSVP'd with, e.g.
   * "going,maybe". Filters to events the caller has that RSVP on.
   */
  myRsvp?: RsvpStatus | RsvpStatus[];

  // Geo proximity
  locationFilters?: EventLocationFilters;

  // Free-text filters
  titleFilters?: EventTextFilters;
  descriptionFilters?: EventDescriptionFilters;

  /** Associations to expand: `user`, `space`, `files`, `userRsvp`. */
  include?: EventIncludeParam;
}

export async function fetchManyEvents(
  client: SublayHttpClient,
  data: FetchManyEventsProps = {}
): Promise<PaginatedResponse<Event>> {
  const response = await client.projectInstance.get<PaginatedResponse<Event>>(
    `/events`,
    {
      params: {
        ...data,
        // One comma-separated value, like `include`.
        myRsvp: serializeInclude(data.myRsvp),
        include: serializeInclude(data.include),
      },
    }
  );
  return response.data;
}

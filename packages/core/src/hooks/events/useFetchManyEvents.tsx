import { useCallback } from "react";
import useProject from "../projects/useProject";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import {
  Event,
  EventIncludeParam,
  EventStatus,
  EventType,
  RsvpStatus,
} from "../../interfaces/models/Event";
import { PaginatedResponse } from "../../interfaces/PaginatedResponse";

// Serialize nested filter objects into bracket notation (mirrors
// useFetchManyEntities so the server's qs parser reconstructs them).
const serializeObject = (obj: any, prefix: string): Record<string, any> => {
  const params: Record<string, any> = {};
  for (const key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      const paramKey = prefix ? `${prefix}[${key}]` : key;
      const value = obj[key];
      if (value === null || value === undefined) continue;
      if (Array.isArray(value)) {
        value.forEach((item, index) => {
          if (item !== null && item !== undefined) {
            if (typeof item === "object") {
              Object.assign(params, serializeObject(item, `${paramKey}[${index}]`));
            } else {
              params[`${paramKey}[${index}]`] = item;
            }
          }
        });
      } else if (typeof value === "object") {
        Object.assign(params, serializeObject(value, paramKey));
      } else {
        params[paramKey] = value;
      }
    }
  }
  return params;
};

export interface EventTitleFilters {
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
  latitude: string | number;
  longitude: string | number;
  radius: string | number;
}

export interface FetchManyEventsProps {
  page?: number;
  limit?: number;
  sortBy?: "startTime" | "going";
  sortDir?: "asc" | "desc";
  timeWindow?: "upcoming" | "ongoing" | "past";
  startsAfter?: string; // ISO datetime
  startsBefore?: string; // ISO datetime
  /** Only this space's events, or `"none"` for events not in any space. `null` or left out: every event. */
  spaceId?: string | "none" | null;
  hostId?: string;
  type?: EventType;
  status?: EventStatus;
  /** RSVP statuses the logged-in user RSVP'd with, e.g. ["going","maybe"]. */
  myRsvp?: RsvpStatus | RsvpStatus[];
  locationFilters?: EventLocationFilters;
  titleFilters?: EventTitleFilters;
  descriptionFilters?: EventDescriptionFilters;
  /** Associations to expand: `user`, `space`, `files`, `userRsvp`. */
  include?: EventIncludeParam;
}

type RsvpStatusFilter = "going" | "maybe" | "not-going";

function useFetchManyEvents(): (
  props?: FetchManyEventsProps
) => Promise<PaginatedResponse<Event>> {
  const { projectId } = useProject();
  const axios = useAxiosPrivate();

  const fetchManyEvents = useCallback(
    async (props?: FetchManyEventsProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const params: Record<string, any> = {};

      if (props?.page !== undefined) params.page = props.page;
      if (props?.limit !== undefined) params.limit = props.limit;
      if (props?.sortBy) params.sortBy = props.sortBy;
      if (props?.sortDir) params.sortDir = props.sortDir;
      if (props?.timeWindow) params.timeWindow = props.timeWindow;
      if (props?.startsAfter) params.startsAfter = props.startsAfter;
      if (props?.startsBefore) params.startsBefore = props.startsBefore;
      if (props?.spaceId) params.spaceId = props.spaceId;
      if (props?.hostId) params.hostId = props.hostId;
      if (props?.type) params.type = props.type;
      if (props?.status) params.status = props.status;
      if (props?.myRsvp) {
        params.myRsvp = Array.isArray(props.myRsvp)
          ? props.myRsvp.join(",")
          : props.myRsvp;
      }
      if (props?.include) {
        params.include = Array.isArray(props.include)
          ? props.include.join(",")
          : props.include;
      }

      if (props?.locationFilters) {
        Object.assign(params, serializeObject(props.locationFilters, "locationFilters"));
      }
      if (props?.titleFilters) {
        Object.assign(params, serializeObject(props.titleFilters, "titleFilters"));
      }
      if (props?.descriptionFilters) {
        Object.assign(
          params,
          serializeObject(props.descriptionFilters, "descriptionFilters")
        );
      }

      const response = await axios.get<PaginatedResponse<Event>>(
        `/${projectId}/events`,
        { params }
      );

      return response.data;
    },
    [projectId, axios]
  );

  return fetchManyEvents;
}

export default useFetchManyEvents;

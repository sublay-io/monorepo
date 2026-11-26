import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event, EventIncludeParam } from "../../interfaces/models/Event";
import { SublayError } from "../../errors/SublayError";

export interface FetchEventProps {
  eventId: string;
  /** Associations to expand: `user`, `space`, `files`, `userRsvp`. */
  include?: EventIncludeParam;
}

function useFetchEvent(): (props: FetchEventProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const fetchEvent = useCallback(
    async ({ eventId, include }: FetchEventProps) => {
      if (!projectId) {
        throw new SublayError("No projectId available.");
      }
      if (!eventId) {
        throw new SublayError("Please pass an eventId");
      }

      const params: Record<string, any> = {};
      if (include) {
        params.include = Array.isArray(include) ? include.join(",") : include;
      }

      const response = await axios.get(`/${projectId}/events/${eventId}`, {
        params,
      });

      return response.data as Event;
    },
    [projectId, axios]
  );

  return fetchEvent;
}

export default useFetchEvent;

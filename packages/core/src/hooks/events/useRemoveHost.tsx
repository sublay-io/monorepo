import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { Event } from "../../interfaces/models/Event";

export interface RemoveHostProps {
  eventId: string;
  /** The host to remove. Rejected if it would leave the event with no hosts. */
  userId: string;
}

function useRemoveHost(): (props: RemoveHostProps) => Promise<Event> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const removeHost = useCallback(
    async ({ eventId, userId }: RemoveHostProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.delete(
        `/${projectId}/events/${eventId}/hosts/${userId}`
      );

      return response.data as Event;
    },
    [projectId, axios]
  );

  return removeHost;
}

export default useRemoveHost;

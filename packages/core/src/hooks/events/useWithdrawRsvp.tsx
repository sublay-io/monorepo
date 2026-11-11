import { useCallback } from "react";
import useAxiosPrivate from "../../config/useAxiosPrivate";
import useProject from "../projects/useProject";
import { WithdrawRsvpResponse } from "../../interfaces/models/Event";

export interface WithdrawRsvpProps {
  eventId: string;
}

/**
 * Withdraws the logged-in user's RSVP. Works whenever they hold one, also on
 * an event they can no longer see. Returns the full event, or
 * `{ id, userRsvp: null }` when they can't see the event.
 */
function useWithdrawRsvp(): (
  props: WithdrawRsvpProps
) => Promise<WithdrawRsvpResponse> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const withdrawRsvp = useCallback(
    async ({ eventId }: WithdrawRsvpProps) => {
      if (!projectId) {
        throw new Error("No projectId available.");
      }

      const response = await axios.delete(
        `/${projectId}/events/${eventId}/rsvp`
      );

      return response.data as WithdrawRsvpResponse;
    },
    [projectId, axios]
  );

  return withdrawRsvp;
}

export default useWithdrawRsvp;

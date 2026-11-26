import { useCallback } from "react";
import useAxiosPrivate from "../../../config/useAxiosPrivate";
import useProject from "../../projects/useProject";
import type { ConnectionRequestParams, ConnectionRow } from "../../../interfaces/models/Connection";
import { SublayError } from "../../../errors/SublayError";

/**
 * Request a connection with `userId`. Answers 201 with the new pending row,
 * or 200 with the existing row when the signed-in user's request is still
 * pending or the two are already connected (the stored message is kept). A
 * request `userId` already sent the signed-in user is a 409
 * `connection/request-received` whose body carries that row as `connection`;
 * after `userId` declined the request it is a 409 `connection/request-declined`.
 */
function useRequestConnection(): (props: ConnectionRequestParams) => Promise<ConnectionRow> {
  const axios = useAxiosPrivate();
  const { projectId } = useProject();

  const requestConnection = useCallback(
    async (props: ConnectionRequestParams): Promise<ConnectionRow> => {
      const { userId, message } = props;
      if (!projectId) {
        throw new SublayError("No project specified");
      }

      if (!userId) {
        throw new SublayError("No user ID was provided");
      }

      // `user` on the returned row is the receiver; `type` is "sent".
      const response = await axios.post<ConnectionRow>(
        `/${projectId}/users/${userId}/connection`,
        { message }
      );

      return response.data;
    },
    [axios, projectId]
  );

  return requestConnection;
}

export default useRequestConnection;
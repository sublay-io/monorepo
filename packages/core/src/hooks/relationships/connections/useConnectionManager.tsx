import { useState, useEffect, useCallback } from "react";
import useRequestConnection from "./useRequestConnection";
import useAcceptConnection from "./useAcceptConnection";
import useDeclineConnection from "./useDeclineConnection";
import useRemoveConnection from "./useRemoveConnection";
import useRemoveConnectionByUserId from "./useRemoveConnectionByUserId";
import useGetConnectionStatus from "./useFetchConnectionStatus";
import useUser from "../../user/useUser";
import type { ConnectionRow } from "../../../interfaces/models/Connection";
import { toSublayError } from "../../../errors/SublayError";

export interface UseConnectionManagerProps {
  userId: string;
}

/**
 * The signed-in user's connection with `userId`, as one value: the
 * connection's `status`, joined with its `type` while it is pending or
 * declined (`"pending-sent"`: the signed-in user sent the request), or
 * `"none"` when no connection exists.
 */
export type ConnectionState =
  | "none"
  | "pending-sent"
  | "pending-received"
  | "accepted"
  | "declined-sent"
  | "declined-received";

export interface UseConnectionManagerValues {
  connectionStatus: ConnectionState;
  connectionId: string | null;
  /** The connection row (`user` = `userId`), or null when there is none. */
  connection: ConnectionRow | null;
  loading: boolean;
  sendConnectionRequest: (props?: { message?: string }) => Promise<void>;
  acceptConnectionRequest: () => Promise<void>;
  declineConnectionRequest: () => Promise<void>;
  withdrawConnectionRequest: () => Promise<void>;
  disconnectUser: () => Promise<void>;
  removeConnectionSmart: () => Promise<void>;
  refreshConnectionStatus: () => Promise<void>;
}

function stateOf(connection: ConnectionRow | null): ConnectionState {
  if (!connection) return "none";
  if (connection.status === "accepted") return "accepted";
  return `${connection.status}-${connection.type}`;
}

function useConnectionManager({ userId }: UseConnectionManagerProps): UseConnectionManagerValues {
  const { user } = useUser();

  const [connection, setConnection] = useState<ConnectionRow | null>(null);
  const [loading, setLoading] = useState(true);

  const connectionStatus = stateOf(connection);
  const connectionId = connection?.id ?? null;

  const requestConnection = useRequestConnection();
  const acceptConnection = useAcceptConnection();
  const declineConnection = useDeclineConnection();
  const removeConnection = useRemoveConnection();
  const removeConnectionByUserId = useRemoveConnectionByUserId();
  const getConnectionStatus = useGetConnectionStatus();

  const loadConnectionStatus = useCallback(async () => {
    if (!userId || user?.id === userId) {
      setConnection(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const status = await getConnectionStatus({ userId });
      setConnection("connection" in status ? status.connection : null);
    } catch (error) {
      console.error("Failed to fetch connection status:", error);
      setConnection(null);
    } finally {
      setLoading(false);
    }
  }, [userId, user?.id, getConnectionStatus]);

  useEffect(() => {
    loadConnectionStatus();
  }, [loadConnectionStatus]);

  const sendConnectionRequest = useCallback(
    async ({ message }: { message?: string } = {}) => {
      if (
        (connectionStatus !== "none" && connectionStatus !== "declined-received") ||
        loading ||
        user?.id === userId
      )
        return;

      try {
        // A repeat of a request still pending, or a request to a user already
        // connected, answers 200 with that row, so the state catches up.
        const result = await requestConnection({ userId, message });
        setConnection(result);
      } catch (error) {
        // `userId` sent the signed-in user a request meanwhile: the 409 body
        // carries that row, so the state shows it (ready to accept) while the
        // call still fails.
        const { code, body } = toSublayError(error);
        if (code === "connection/request-received" && body?.connection) {
          setConnection(body.connection as ConnectionRow);
        }
        console.error("Failed to send connection request:", error);
        throw toSublayError(error);
      }
    },
    [connectionStatus, loading, userId, user?.id, requestConnection]
  );

  const acceptConnectionRequest = useCallback(async () => {
    if (connectionStatus !== "pending-received" || !connectionId || loading)
      return;

    try {
      const result = await acceptConnection({ connectionId });
      setConnection(result);
    } catch (error) {
      console.error("Failed to accept connection request:", error);
      throw toSublayError(error);
    }
  }, [connectionStatus, connectionId, loading, acceptConnection]);

  const declineConnectionRequest = useCallback(async () => {
    if (connectionStatus !== "pending-received" || !connectionId || loading)
      return;

    try {
      const result = await declineConnection({ connectionId });
      setConnection(result);
    } catch (error) {
      console.error("Failed to decline connection request:", error);
      throw toSublayError(error);
    }
  }, [connectionStatus, connectionId, loading, declineConnection]);

  const withdrawConnectionRequest = useCallback(async () => {
    if (connectionStatus !== "pending-sent" || !connectionId || loading)
      return;

    try {
      await removeConnection({ connectionId });
      setConnection(null);
    } catch (error) {
      console.error("Failed to withdraw connection request:", error);
      throw toSublayError(error);
    }
  }, [connectionStatus, connectionId, loading, removeConnection]);

  const disconnectUser = useCallback(async () => {
    if (connectionStatus !== "accepted" || !connectionId || loading) return;

    try {
      await removeConnection({ connectionId });
      setConnection(null);
    } catch (error) {
      console.error("Failed to disconnect user:", error);
      throw toSublayError(error);
    }
  }, [connectionStatus, connectionId, loading, removeConnection]);

  const removeConnectionSmart = useCallback(async () => {
    if (
      connectionStatus === "none" ||
      connectionStatus === "declined-sent" ||
      // Already declined: the server has nothing left to remove (404).
      connectionStatus === "declined-received" ||
      loading ||
      user?.id === userId
    )
      return;

    try {
      await removeConnectionByUserId({ userId });
      if (connectionStatus === "pending-received") {
        // The server declines a request it received rather than deleting it,
        // and answers 204 with no body: read the declined row back.
        await loadConnectionStatus();
      } else {
        setConnection(null);
      }
    } catch (error) {
      console.error("Failed to remove connection:", error);
      throw toSublayError(error);
    }
  }, [
    connectionStatus,
    loading,
    userId,
    user?.id,
    removeConnectionByUserId,
    loadConnectionStatus,
  ]);

  return {
    connectionStatus,
    connectionId,
    connection,
    loading,
    sendConnectionRequest,
    acceptConnectionRequest,
    declineConnectionRequest,
    withdrawConnectionRequest,
    disconnectUser,
    removeConnectionSmart,
    refreshConnectionStatus: loadConnectionStatus,
  };
}

export default useConnectionManager;

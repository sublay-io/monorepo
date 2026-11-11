import { User } from "./User";

/** A connection's stored state. */
export type ConnectionRowStatus = "pending" | "accepted" | "declined";

/**
 * A connection request, seen from the caller's side — what the pending lists,
 * request / accept / decline responses and the status check return.
 *
 * - `id` is the connection's own id (what `/connections/:connectionId/…` takes).
 * - `user` is the counterpart: the receiver on a request the caller sent, the
 *   requester on one they received.
 * - `type` is whether the caller sent or received the request; `message` is
 *   the request's note, or null.
 * - `respondedAt` is when the receiver accepted or declined (null while
 *   pending).
 */
export interface ConnectionRow {
  id: string;
  user: User;
  type: "sent" | "received";
  message: string | null;
  status: ConnectionRowStatus;
  createdAt: string;
  respondedAt: string | null;
}

/**
 * An accepted connection, as the connection lists (`GET /connections`,
 * `GET /users/:userId/connections`) return it: `user` is the other user from
 * the list owner's side. No `type` or `message`, for every caller.
 */
export interface AcceptedConnectionRow {
  id: string;
  user: User;
  status: "accepted";
  createdAt: string;
  respondedAt: string;
}

/**
 * `GET /users/:userId/connection`. `isConnected` is true only once accepted;
 * `connection` is present whenever a connection exists between the two users,
 * pending and declined included (its `status` and `type` tell them apart).
 */
export type ConnectionStatus =
  | { isConnected: false }
  | {
      isConnected: false;
      connection: ConnectionRow & { status: "pending" | "declined" };
    }
  | { isConnected: true; connection: ConnectionRow & { status: "accepted" } };

export interface ConnectionRequestParams {
  userId: string;
  message?: string;
}

export interface ConnectionCountResponse {
  count: number;
}

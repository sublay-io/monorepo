import { User } from "./User";

/** A connection's stored state. */
export type ConnectionRowStatus = "pending" | "accepted" | "declined";

/**
 * A connection in an accepted-connections list, seen from the side of the user
 * whose list it is: `user` is their counterpart.
 *
 * - `id` is the connection's own id.
 * - `createdAt` is when the request was made; `respondedAt` when it was
 *   accepted.
 */
export interface AcceptedConnectionRow {
  id: string;
  user: User;
  status: "accepted";
  createdAt: string;
  respondedAt: string;
}

/**
 * A connection request seen from the caller's side: `user` is the
 * counterpart, `type` is `sent` when the caller made the request and
 * `received` when the other user did, and `message` is the request's note (or
 * `null`). Returned by the pending lists, request / accept / decline and the
 * connection status.
 * `respondedAt` is `null` while the request is pending.
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

export interface ConnectionRequestParams {
  userId: string;
  message?: string;
}

export interface ConnectionCountResponse {
  count: number;
}

/**
 * The connection between the acting user and the target. `isConnected` is
 * `true` only once the connection is accepted. `connection` is present
 * whenever a connection row exists between the two users, pending and
 * declined included (its `status` and `type` tell them apart); with no row
 * there is no `connection`.
 */
export type ConnectionStatus =
  | { isConnected: false }
  | {
      isConnected: false;
      connection: ConnectionRow & { status: "pending" | "declined" };
    }
  | { isConnected: true; connection: ConnectionRow & { status: "accepted" } };

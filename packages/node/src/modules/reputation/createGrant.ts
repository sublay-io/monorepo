import { SublayHttpClient } from "../../core/client";
import {
  GrantWriteCommonProps,
  ReputationGrant,
  ReputationGrantTargetFilter,
} from "../../interfaces/ReputationGrant";

interface CreateGrantBaseProps extends GrantWriteCommonProps {
  /**
   * The sender — the user the reputation is debited FROM, named as the user
   * the service key acts as. Required: a service key has no session user, so
   * the actor must be named explicitly.
   */
  actingUserId: string;
  /** The user receiving the reputation. Must differ from `actingUserId`. */
  recipientId: string;
  /**
   * Positive integer. A transfer can never mint (negatives) nor be a no-op
   * (zero) — use {@link mintGrant} to create or destroy reputation.
   */
  amount: number;
}

/**
 * `targetType` and `targetId` are supplied together or not at all — the
 * both-or-neither pair is carried by {@link ReputationGrantTargetFilter}, which
 * makes the half-filled shape a compile error instead of a
 * `400 reputation-grant/invalid-body`.
 */
export type CreateGrantProps = CreateGrantBaseProps &
  ReputationGrantTargetFilter;

/**
 * Transfers reputation from one user to another — a **debited transfer**: the
 * amount leaves the sender's bucket and lands in the recipient's bucket in the
 * same space. Nothing is created.
 *
 * A service key is the "mediated" caller here: the project setting that can
 * disable user-initiated grants only closes the route to user tokens, so it is
 * skipped. Everything else is the sender's own: a block between the two users
 * (either way) answers 404 `reputation-grant/user-not-found`, exactly as for
 * the sender's own grant, and a suspended sender is refused. To pay a user
 * regardless, use {@link mintGrant}.
 */
export async function createGrant(
  client: SublayHttpClient,
  data: CreateGrantProps
): Promise<ReputationGrant> {
  const response = await client.projectInstance.post<ReputationGrant>(
    "/reputation-grants",
    data
  );
  return response.data;
}

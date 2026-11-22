import { serializeInclude } from "../../core/includeParam";
import { SublayHttpClient } from "../../core/client";
import {
  GrantSummary,
  ReputationGrant,
  ReputationGrantIncludeParam,
  ReputationGrantTargetType,
} from "../../interfaces/ReputationGrant";
import { PaginatedResponse } from "../../interfaces/IPaginatedResponse";
import { SpaceReputationContextParams } from "../../interfaces/SpaceReputation";
import { buildSpaceReputationParams } from "../../core/spaceReputationParams";

interface ListGrantsBaseProps extends SpaceReputationContextParams {
  page?: number;
  limit?: number; // 1 to 100; over 100 is a 400, never clamped

  /** Associations to expand. Only `"user"` is supported (hydrates both parties). */
  include?: ReputationGrantIncludeParam;

  /**
   * List as this user (service key only): exactly what their own access token
   * would get (grants on chat messages only where they can read the message;
   * the summary's `viewerTotal`). Omit it to get what a signed-in user in no
   * conversation gets: no grants on chat messages.
   */
  actingUserId?: string;
}

/**
 * The filter: exactly one shape per request — what a user received
 * (`recipientId`), what a user sent (`senderId`), or who rewarded an item
 * (`targetType` + `targetId`, always together).
 */
export type ListGrantsFilter =
  | {
      /** What this user received. */
      recipientId: string;
      senderId?: never;
      targetType?: never;
      targetId?: never;
    }
  | {
      /** What this user sent. */
      senderId: string;
      recipientId?: never;
      targetType?: never;
      targetId?: never;
    }
  | {
      /** The kind of item rewarded. */
      targetType: ReputationGrantTargetType;
      /** The rewarded item's id. */
      targetId: string;
      recipientId?: never;
      senderId?: never;
    };

export type ListGrantsProps = ListGrantsBaseProps & ListGrantsFilter;

/**
 * The `summary` block rides alongside the page envelope, and only on the
 * target filter shape (`targetType` + `targetId`), where it is always present.
 */
export interface ListGrantsResponse extends PaginatedResponse<ReputationGrant> {
  summary?: GrantSummary;
}

/**
 * Lists reputation grants.
 *
 * Exactly one filter shape per request — `recipientId`, `senderId`, or
 * `targetType` + `targetId` (see {@link ListGrantsFilter}); the shapes are
 * not AND-ed, which is what keeps the `summary` block reconcilable
 * with the rows beneath it.
 *
 * Only positive grants are ever returned, for every caller. Negative grants are app moderation deductions and are readable
 * only from the dashboard.
 */
export async function listGrants(
  client: SublayHttpClient,
  data: ListGrantsProps
): Promise<ListGrantsResponse> {
  const {
    spaceReputation,
    ...rest
  } = data;
  const response = await client.projectInstance.get<ListGrantsResponse>(
    "/reputation-grants",
    {
      params: {
        ...rest,
        include: serializeInclude(rest.include),
        // `spaceReputationId=context` scores each hydrated user against THAT
        // GRANT'S own bucket. Normalized rather than spread raw — axios would
        // bracket-encode the object and the server would ignore it.
        ...buildSpaceReputationParams({ spaceReputation }),
      },
    }
  );
  return response.data;
}

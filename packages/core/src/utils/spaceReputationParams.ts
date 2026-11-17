/**
 * Input accepted by {@link buildSpaceReputationParams}: the `spaceReputation`
 * object a hook or function takes.
 */
export interface BuildSpaceReputationParamsInput {
  spaceReputation?: {
    spaceId: string | "none" | "context";
    includeDescendants?: boolean;
  } | null;
}

/**
 * Flat output merged into a GET's query (axios `params`) or a POST's body.
 * These are the server's own param names. Both keys are omitted when unset —
 * never bracketed, never nested.
 */
export interface SpaceReputationFlatParams {
  spaceReputationId?: string;
  spaceReputationDescendants?: boolean;
}

/**
 * Turn the `spaceReputation` object into the flat params the server
 * understands (`spaceReputationId` / `spaceReputationDescendants`).
 *
 * This is the only thing that keeps the nested object out of a request: in a
 * query axios would bracket-encode it (`spaceReputation[spaceId]=…`), and in a
 * body it would arrive as an unknown key; the server ignores both. Every
 * reputation-consuming call routes the object through here and sends only the
 * flat output.
 */
export function buildSpaceReputationParams(
  input: BuildSpaceReputationParamsInput
): SpaceReputationFlatParams {
  const { spaceReputation } = input;
  const result: SpaceReputationFlatParams = {};
  if (!spaceReputation) return result;

  const { spaceId, includeDescendants } = spaceReputation;
  if (spaceId !== undefined && spaceId !== null) {
    result.spaceReputationId = spaceId;
  }
  if (includeDescendants !== undefined && includeDescendants !== null) {
    result.spaceReputationDescendants = includeDescendants;
  }
  return result;
}

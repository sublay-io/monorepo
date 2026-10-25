import { isProduction } from "./env";

/**
 * Input accepted by {@link buildSpaceReputationParams}: either the new
 * `spaceReputation` object or the deprecated flat props.
 *
 * The flat inputs accept `null` (in addition to `undefined`) because the
 * entity-lists path persists them as `string | null` / `boolean | null` and
 * passes `null` through to mean "explicitly unset". `null` is treated as unset.
 */
export interface BuildSpaceReputationParamsInput {
  spaceReputation?: {
    spaceId: string | "none" | "context";
    includeDescendants?: boolean;
  };
  /**
   * @deprecated Pass `spaceReputation` instead. Accepted for back-compat.
   */
  spaceReputationId?: string | null;
  /**
   * @deprecated Pass `spaceReputation` instead. Accepted for back-compat.
   */
  spaceReputationDescendants?: boolean | null;
}

/**
 * Flat output merged into a GET's query or a POST's body. Both keys are
 * omitted when unset — never bracketed, never nested.
 */
export interface SpaceReputationFlatParams {
  spaceReputationId?: string;
  spaceReputationDescendants?: boolean;
}

let bothFormsWarned = false;

/**
 * Normalize the `spaceReputation` object or the deprecated flat props down to
 * the flat params the server understands
 * (`spaceReputationId` / `spaceReputationDescendants`).
 *
 * Rules:
 * - **Object wins when present.** "Present" means the `spaceReputation` key was
 *   supplied at all (`spaceReputation !== undefined`) — even `{}` or a partial
 *   object suppresses the flat props, because supplying the key is an explicit
 *   opt-in to the new form.
 * - When **both** the object and a flat prop are supplied, the object wins and
 *   a one-time dev-only `console.warn` fires (never throws).
 * - The flat inputs tolerate `null` (treated as unset → param omitted).
 * - Output keys are omitted when unset; the result is always the two flat keys,
 *   never a bracketed/nested object.
 */
export function buildSpaceReputationParams(
  input: BuildSpaceReputationParamsInput
): SpaceReputationFlatParams {
  const { spaceReputation, spaceReputationId, spaceReputationDescendants } =
    input;

  const objectPresent = spaceReputation !== undefined;
  const flatPresent =
    (spaceReputationId !== undefined && spaceReputationId !== null) ||
    (spaceReputationDescendants !== undefined &&
      spaceReputationDescendants !== null);

  if (objectPresent && flatPresent && !bothFormsWarned && !isProduction()) {
    bothFormsWarned = true;
    // eslint-disable-next-line no-console
    console.warn(
      "[Sublay] Both `spaceReputation` and the deprecated flat props " +
        "(`spaceReputationId` / `spaceReputationDescendants`) were supplied. " +
        "The `spaceReputation` object takes precedence; the flat props are ignored. " +
        "Remove the flat props — they are deprecated."
    );
  }

  const result: SpaceReputationFlatParams = {};

  if (objectPresent) {
    // Object form chosen. Read from the object; ignore the flat props entirely.
    const spaceId = spaceReputation!.spaceId;
    if (spaceId !== undefined && spaceId !== null) {
      result.spaceReputationId = spaceId;
    }
    const includeDescendants = spaceReputation!.includeDescendants;
    if (includeDescendants !== undefined && includeDescendants !== null) {
      result.spaceReputationDescendants = includeDescendants;
    }
    return result;
  }

  // Flat form. `null` is treated as unset (param omitted).
  if (spaceReputationId !== undefined && spaceReputationId !== null) {
    result.spaceReputationId = spaceReputationId;
  }
  if (
    spaceReputationDescendants !== undefined &&
    spaceReputationDescendants !== null
  ) {
    result.spaceReputationDescendants = spaceReputationDescendants;
  }

  return result;
}

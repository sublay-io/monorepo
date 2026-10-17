/**
 * Sorts that rank one way only. The server refuses `sortDir` (and, for a
 * comment reply level, `replySortDir`) with them.
 */
export const ONE_WAY_SORTS = ["hot", "controversial"] as const;
export type OneWaySort = (typeof ONE_WAY_SORTS)[number];

export function isOneWaySort(sortBy: string | null | undefined): boolean {
  return !!sortBy && (ONE_WAY_SORTS as readonly string[]).includes(sortBy);
}

/** `sortDir` as it may be sent with `sortBy`: dropped for a one-way sort. */
export function sendableSortDir<D>(
  sortBy: string | null | undefined,
  sortDir: D,
): D | undefined {
  return isOneWaySort(sortBy) ? undefined : sortDir;
}

/**
 * `{ sortBy, sortDir }` for a request, with `sortDir` left out for a one-way
 * sort — typed so it satisfies the request types that refuse `sortDir` there.
 * For callers that hold `sortBy` and `sortDir` as separate state.
 */
export function oneWaySortFields<S extends string, D>(
  sortBy: S,
  sortDir: D,
):
  | { sortBy: Extract<S, OneWaySort>; sortDir?: never }
  | { sortBy: Exclude<S, OneWaySort>; sortDir: D } {
  return (isOneWaySort(sortBy) ? { sortBy } : { sortBy, sortDir }) as
    | { sortBy: Extract<S, OneWaySort>; sortDir?: never }
    | { sortBy: Exclude<S, OneWaySort>; sortDir: D };
}

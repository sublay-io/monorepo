/** Sorts that rank one way only: the server refuses `sortDir` with them. */
export type OneWaySort = "hot" | "controversial";

/**
 * A request's sort fields with `sortDir` ruled out for a one-way sort: with
 * `sortBy: "hot"` or `"controversial"`, no `sortDir`; with any other sort (or
 * none), `sortDir` as usual.
 */
export type WithOneWaySortDir<T extends { sortBy?: unknown; sortDir?: unknown }> =
  | (Omit<T, "sortBy" | "sortDir"> & {
      sortBy: Extract<NonNullable<T["sortBy"]>, OneWaySort>;
      sortDir?: never;
    })
  | (Omit<T, "sortBy"> & {
      sortBy?: Exclude<NonNullable<T["sortBy"]>, OneWaySort> | null;
    });

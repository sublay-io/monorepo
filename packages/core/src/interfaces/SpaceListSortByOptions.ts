/**
 * Space-list sorts. Time order is `"createdAt"`; with `sortDir` every sort can
 * be reversed (left out, the natural direction: A→Z for `"alphabetical"`,
 * otherwise newest / most first).
 */
export type SpaceListSortByOptions = "createdAt" | "members" | "alphabetical";

/** A user's spaces also sort by when the user joined each one. */
export type UserSpacesSortByOptions = SpaceListSortByOptions | "joinedAt";

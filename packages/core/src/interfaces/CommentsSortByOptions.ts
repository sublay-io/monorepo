/** Comment sorts. Time order is `"createdAt"` with `sortDir`. */
export type CommentsSortByOptions = "createdAt" | "top" | "controversial";

/** Sort options for the nested reply levels (`replySortBy`). */
export type CommentReplySortByOptions = CommentsSortByOptions;

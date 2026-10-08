/**
 * @deprecated Use `"createdAt"` (with `sortDir`) instead. `"new"` (createdAt
 * DESC) and `"old"` (createdAt ASC) are directional aliases kept for backwards
 * compatibility and removed in v8. The server still accepts them (identical
 * behavior) but responds with deprecation headers.
 */
export type DeprecatedCommentsSortBy = "new" | "old";

export type CommentsSortByOptions =
  | "createdAt"
  | "top"
  | "controversial"
  | DeprecatedCommentsSortBy;

/**
 * Sort options for the nested reply levels (`replySortBy`). The deprecated
 * `new`/`old` aliases aren't accepted there.
 */
export type CommentReplySortByOptions = Exclude<
  CommentsSortByOptions,
  DeprecatedCommentsSortBy
>;

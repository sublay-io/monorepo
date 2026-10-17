import type { CommentsSortByOptions } from "@sublay/react-native";
import strings from "./strings";

// The sorts the sort sheet offers, each with the direction it sorts in. New
// and Old share createdAt and differ only in direction. Remove an entry to
// drop that option; the first entry is shown when the section's sort isn't
// listed.
export const SORT_OPTIONS: {
  sortBy: CommentsSortByOptions;
  sortDir: "asc" | "desc";
  label: string;
}[] = [
  { sortBy: "top", sortDir: "desc", label: strings.sortTop },
  { sortBy: "createdAt", sortDir: "desc", label: strings.sortNew },
  { sortBy: "createdAt", sortDir: "asc", label: strings.sortOld },
  { sortBy: "controversial", sortDir: "desc", label: strings.sortControversial },
];

/** The option for the section's current sort (controversial ranks one way only). */
export function findSortOption(
  sortBy: CommentsSortByOptions | undefined,
  sortDir: "asc" | "desc" | undefined
) {
  return (
    SORT_OPTIONS.find(
      (option) =>
        option.sortBy === sortBy &&
        (option.sortBy === "controversial" || option.sortDir === sortDir)
    ) ?? SORT_OPTIONS[0]
  );
}

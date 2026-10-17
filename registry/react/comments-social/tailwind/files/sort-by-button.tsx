import { ReactNode } from "react";
import { CommentsSortByOptions, useCommentSection } from "@sublay/react-js";
import { resetButton } from "~shared/react/reset-styles";

export function SortByButton({
  priority,
  sortDir = "desc",
  activeView,
  nonActiveView,
}: {
  priority: CommentsSortByOptions;
  // The direction this option sorts in (defaults to "desc"). The section's
  // direction carries over between sorts, so each option sets its own; it
  // isn't sent for "controversial", which ranks one way only.
  sortDir?: "asc" | "desc";
  activeView: ReactNode;
  nonActiveView: ReactNode;
}) {
  const {
    sortBy,
    setSortBy,
    sortDir: currentSortDir,
    setSortDir,
  } = useCommentSection();

  // Active only when both the sort and its direction match (New and Old share
  // `createdAt` and differ only in direction).
  const isActive = sortBy === priority && currentSortDir === sortDir;

  const handleClick = () => {
    setSortBy!(priority);
    setSortDir!(sortDir);
  };

  return (
    <button style={{ ...resetButton }} onClick={handleClick}>
      {isActive ? activeView : nonActiveView}
    </button>
  );
}

export default SortByButton;
